/**
 * 收藏夹服务
 * 管理用户的收藏夹和文件收藏
 */
import { PrismaClient } from '@prisma/client';
import { FileInfo, mapFileEntityToFileInfo } from '@/app/types';

const prisma = new PrismaClient();

// 定义一个文件错误类
export class FileError extends Error {
  constructor(public type: string, message: string) {
    super(message);
    this.name = 'FileError';
  }
}

// 创建文件错误
export function createFileError(type: string, message: string): FileError {
  return new FileError(type, message);
}

export interface FavoriteFolderInfo {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  fileCount?: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export class FavoriteService {
  /**
   * 获取用户的所有收藏夹
   */
  async getFavoriteFolders(userId: string): Promise<FavoriteFolderInfo[]> {
    try {
      // 查询用户的收藏夹
      const folders = await prisma.favoriteFolder.findMany({
        where: { userId },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'asc' }
        ]
      });

      // 获取每个收藏夹中的文件数量
      const foldersWithCount = await Promise.all(
        folders.map(async (folder) => {
          const count = await prisma.favorite.count({
            where: { 
              folderId: folder.id,
              userId 
            }
          });
          
          return {
            ...folder,
            fileCount: count
          };
        })
      );

      return foldersWithCount;
    } catch (error) {
      console.error('[收藏夹服务] 获取收藏夹列表失败:', error);
      throw createFileError('access', '获取收藏夹列表失败');
    }
  }

  /**
   * 创建一个新的收藏夹
   */
  async createFavoriteFolder(
    userId: string, 
    name: string, 
    description?: string, 
    isDefault = false
  ): Promise<FavoriteFolderInfo> {
    try {
      // 如果设置为默认收藏夹，需要将其他收藏夹的默认状态取消
      if (isDefault) {
        await prisma.favoriteFolder.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false }
        });
      }

      // 创建新收藏夹
      const newFolder = await prisma.favoriteFolder.create({
        data: {
          name,
          description,
          isDefault,
          userId
        }
      });

      return newFolder;
    } catch (error) {
      console.error('[收藏夹服务] 创建收藏夹失败:', error);
      throw createFileError('access', '创建收藏夹失败');
    }
  }

  /**
   * 更新收藏夹信息
   */
  async updateFavoriteFolder(
    userId: string,
    folderId: string,
    data: {
      name?: string;
      description?: string;
      isDefault?: boolean;
    }
  ): Promise<FavoriteFolderInfo> {
    try {
      // 检查收藏夹是否存在且属于当前用户
      const folder = await prisma.favoriteFolder.findFirst({
        where: { id: folderId, userId }
      });

      if (!folder) {
        throw createFileError('notfound', '收藏夹不存在');
      }

      // 如果设置为默认收藏夹，需要将其他收藏夹的默认状态取消
      if (data.isDefault) {
        await prisma.favoriteFolder.updateMany({
          where: { userId, isDefault: true, id: { not: folderId } },
          data: { isDefault: false }
        });
      }

      // 更新收藏夹
      const updatedFolder = await prisma.favoriteFolder.update({
        where: { id: folderId },
        data
      });

      return updatedFolder;
    } catch (error) {
      console.error('[收藏夹服务] 更新收藏夹失败:', error);
      throw createFileError('access', '更新收藏夹失败');
    }
  }

  /**
   * 删除收藏夹
   */
  async deleteFavoriteFolder(userId: string, folderId: string): Promise<boolean> {
    try {
      // 检查收藏夹是否存在且属于当前用户
      const folder = await prisma.favoriteFolder.findFirst({
        where: { id: folderId, userId }
      });

      if (!folder) {
        throw createFileError('notfound', '收藏夹不存在');
      }

      // 如果是默认收藏夹，则不允许删除
      if (folder.isDefault) {
        throw createFileError('forbidden', '不能删除默认收藏夹');
      }

      // 获取默认收藏夹
      const defaultFolder = await this.getOrCreateDefaultFolder(userId);
      
      // 找出此收藏夹中的所有收藏
      const favorites = await prisma.favorite.findMany({
        where: { folderId, userId }
      });
      
      // 将收藏移动到默认收藏夹
      for (const favorite of favorites) {
        // 检查默认收藏夹中是否已有此文件
        const existingFavorite = await prisma.favorite.findFirst({
          where: {
            userId,
            fileId: favorite.fileId,
            folderId: defaultFolder.id
          }
        });
        
        if (!existingFavorite) {
          // 如果默认收藏夹中没有此文件，则将此收藏移到默认收藏夹
          await prisma.favorite.update({
            where: { id: favorite.id },
            data: { folderId: defaultFolder.id }
          });
        } else {
          // 如果默认收藏夹中已有此文件，则删除当前收藏
          await prisma.favorite.delete({
            where: { id: favorite.id }
          });
        }
      }

      // 删除收藏夹
      await prisma.favoriteFolder.delete({
        where: { id: folderId }
      });

      return true;
    } catch (error) {
      console.error('[收藏夹服务] 删除收藏夹失败:', error);
      throw createFileError('access', '删除收藏夹失败');
    }
  }

  /**
   * 获取默认收藏夹，如果不存在则创建一个
   */
  async getOrCreateDefaultFolder(userId: string): Promise<FavoriteFolderInfo> {
    try {
      // 查找默认收藏夹
      let defaultFolder = await prisma.favoriteFolder.findFirst({
        where: { userId, isDefault: true }
      });

      // 如果不存在默认收藏夹，创建一个
      if (!defaultFolder) {
        defaultFolder = await prisma.favoriteFolder.create({
          data: {
            name: '默认收藏夹',
            isDefault: true,
            userId
          }
        });
      }

      return defaultFolder;
    } catch (error) {
      console.error('[收藏夹服务] 获取默认收藏夹失败:', error);
      throw createFileError('access', '获取默认收藏夹失败');
    }
  }

  /**
   * 将文件添加到收藏夹
   */
  async addToFolder(
    userId: string,
    fileId: string,
    folderId?: string
  ): Promise<boolean> {
    try {
      // 确保文件存在且属于当前用户
      const file = await prisma.file.findFirst({
        where: {
          id: fileId,
          uploaderId: userId,
          isDeleted: false,
        }
      });

      if (!file) {
        throw createFileError('notfound', '文件不存在或已被删除');
      }

      // 如果没有指定收藏夹，则使用默认收藏夹
      let actualFolderId = folderId;
      if (!actualFolderId) {
        const defaultFolder = await this.getOrCreateDefaultFolder(userId);
        actualFolderId = defaultFolder.id;
      }

      // 检查收藏夹是否存在
      const folder = await prisma.favoriteFolder.findFirst({
        where: { id: actualFolderId, userId }
      });

      if (!folder) {
        throw createFileError('notfound', '收藏夹不存在');
      }

      // 检查是否已经收藏
      const existingFavorite = await prisma.favorite.findFirst({
        where: {
          fileId,
          folderId: actualFolderId,
          userId
        }
      });

      if (existingFavorite) {
        // 已经收藏过了，返回成功
        return true;
      }

      // 添加收藏记录
      await prisma.favorite.create({
        data: {
          fileId,
          folderId: actualFolderId,
          userId
        }
      });

      return true;
    } catch (error) {
      console.error('[收藏夹服务] 添加收藏失败:', error);
      throw createFileError('access', '添加文件到收藏夹失败');
    }
  }

  /**
   * 批量添加文件到收藏夹
   */
  async addBatchToFolder(
    userId: string,
    fileIds: string[],
    folderId?: string
  ): Promise<number> {
    if (!fileIds.length) {
      return 0;
    }

    console.log(`[收藏夹服务] 批量添加文件到收藏夹, 数量: ${fileIds.length}`);

    try {
      // 如果没有指定收藏夹，则使用默认收藏夹
      let actualFolderId = folderId;
      if (!actualFolderId) {
        const defaultFolder = await this.getOrCreateDefaultFolder(userId);
        actualFolderId = defaultFolder.id;
      }

      // 确保文件存在且属于当前用户
      const files = await prisma.file.findMany({
        where: {
          id: { in: fileIds },
          uploaderId: userId,
          isDeleted: false,
        },
        select: { id: true },
      });

      if (!files.length) {
        return 0;
      }

      // 检查文件是否已经在收藏夹中
      const existingFavorites = await prisma.favorite.findMany({
        where: {
          fileId: { in: fileIds },
          folderId: actualFolderId,
          userId
        },
        select: { fileId: true }
      });

      // 找出尚未收藏的文件
      const existingFileIds = existingFavorites.map(fav => fav.fileId);
      const newFileIds = files
        .map(file => file.id)
        .filter(id => !existingFileIds.includes(id));

      if (!newFileIds.length) {
        return 0;
      }

      // 批量创建收藏记录
      const data = newFileIds.map(fileId => ({
        fileId,
        folderId: actualFolderId,
        userId
      }));

      const result = await prisma.favorite.createMany({
        data,
        skipDuplicates: true
      });

      console.log(`[收藏夹服务] 已添加 ${result.count} 个文件到收藏夹`);
      return result.count;
    } catch (error) {
      console.error('[收藏夹服务] 批量添加收藏失败:', error);
      throw createFileError('access', '批量添加文件到收藏夹失败');
    }
  }

  /**
   * 从收藏夹中移除文件
   */
  async removeFromFolder(
    userId: string,
    fileId: string,
    folderId?: string
  ): Promise<boolean> {
    try {
      const whereClause: any = {
        fileId,
        userId
      };

      if (folderId) {
        whereClause.folderId = folderId;
      }

      // 删除收藏记录
      const result = await prisma.favorite.deleteMany({
        where: whereClause
      });

      return result.count > 0;
    } catch (error) {
      console.error('[收藏夹服务] 移除收藏失败:', error);
      throw createFileError('access', '从收藏夹中移除文件失败');
    }
  }

  /**
   * 批量从收藏夹中移除文件
   */
  async removeBatchFromFolder(
    userId: string,
    fileIds: string[],
    folderId?: string
  ): Promise<number> {
    if (!fileIds.length) {
      return 0;
    }

    try {
      const whereClause: any = {
        fileId: { in: fileIds },
        userId
      };

      if (folderId) {
        whereClause.folderId = folderId;
      }

      // 批量删除收藏记录
      const result = await prisma.favorite.deleteMany({
        where: whereClause
      });

      return result.count;
    } catch (error) {
      console.error('[收藏夹服务] 批量移除收藏失败:', error);
      throw createFileError('access', '从收藏夹中批量移除文件失败');
    }
  }

  /**
   * 检查文件是否在收藏夹中
   */
  async isInFavorites(
    userId: string,
    fileId: string,
    folderId?: string
  ): Promise<boolean> {
    try {
      const whereClause: any = {
        fileId,
        userId
      };

      if (folderId) {
        whereClause.folderId = folderId;
      }

      const count = await prisma.favorite.count({
        where: whereClause
      });

      return count > 0;
    } catch (error) {
      console.error('[收藏夹服务] 检查收藏状态失败:', error);
      throw createFileError('access', '检查收藏状态失败');
    }
  }

  /**
   * 获取收藏夹中的文件列表
   */
  async getFolderFiles(
    userId: string,
    folderId: string,
    page = 1,
    pageSize = 50
  ): Promise<{ items: FileInfo[]; total: number; page: number; pageSize: number }> {
    try {
      // 检查收藏夹是否存在且属于当前用户
      const folder = await prisma.favoriteFolder.findFirst({
        where: { id: folderId, userId }
      });

      if (!folder) {
        throw createFileError('notfound', '收藏夹不存在');
      }

      // 查询条件
      const where = {
        folderId,
        userId
      };

      // 总记录数
      const total = await prisma.favorite.count({ where });

      // 获取收藏记录及对应的文件信息
      const favorites = await prisma.favorite.findMany({
        where,
        include: {
          file: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      // 转换为文件信息列表
      const items = favorites.map(fav => ({
        ...mapFileEntityToFileInfo(fav.file),
        favoriteId: fav.id, // 添加收藏ID
        favoriteFolderId: fav.folderId // 添加收藏夹ID
      }));

      return {
        items,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      console.error('[收藏夹服务] 获取收藏夹文件列表失败:', error);
      throw createFileError('access', '获取收藏夹文件列表失败');
    }
  }

  /**
   * 获取所有收藏文件列表，不区分收藏夹
   */
  async getAllFavoriteFiles(
    userId: string,
    page = 1,
    pageSize = 50
  ): Promise<{ items: FileInfo[]; total: number; page: number; pageSize: number }> {
    try {
      // 查询条件
      const where = {
        userId
      };

      // 总记录数
      const total = await prisma.favorite.count({ where });

      // 获取收藏记录及对应的文件信息
      const favorites = await prisma.favorite.findMany({
        where,
        include: {
          file: true,
          folder: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      // 转换为文件信息列表
      const items = favorites.map(fav => ({
        ...mapFileEntityToFileInfo(fav.file),
        favoriteId: fav.id, // 添加收藏ID
        favoriteFolderId: fav.folderId, // 添加收藏夹ID
        favoriteFolderName: fav.folder.name // 添加收藏夹名称
      }));

      return {
        items,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      console.error('[收藏夹服务] 获取所有收藏文件列表失败:', error);
      throw createFileError('access', '获取收藏文件列表失败');
    }
  }

  /**
   * 将自定义添加文件到标签的功能保留，用于兼容旧版收藏功能
   * 注意：由于模型中没有isFavorite字段，我们使用tags数组存储收藏状态
   */
  async addToFavorites(userId: string, fileIds: string[]): Promise<number> {
    // 获取默认收藏夹
    const defaultFolder = await this.getOrCreateDefaultFolder(userId);
    
    // 将文件添加到默认收藏夹
    return this.addBatchToFolder(userId, fileIds, defaultFolder.id);
  }

  /**
   * 将自定义移除文件的功能保留，用于兼容旧版收藏功能
   * 注意：与新版不同，这里会从所有收藏夹中移除
   */
  async removeFromFavorites(userId: string, fileIds: string[]): Promise<number> {
    // 从所有收藏夹中移除
    return this.removeBatchFromFolder(userId, fileIds);
  }

  /**
   * 将自定义获取收藏文件列表的功能保留，用于兼容旧版收藏功能
   */
  async getFavorites(
    userId: string,
    page = 1,
    pageSize = 50
  ): Promise<{ items: FileInfo[]; total: number; page: number; pageSize: number }> {
    return this.getAllFavoriteFiles(userId, page, pageSize);
  }
} 