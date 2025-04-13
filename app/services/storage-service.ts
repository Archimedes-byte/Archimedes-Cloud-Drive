/**
 * 存储服务模块
 * 提供文件和文件夹操作的业务逻辑
 */
import { prisma } from '@/app/lib/database';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join, basename, extname, dirname } from 'path';
import path from 'path';
import { 
  getFileCategory, 
  generateUniqueFilename, 
  sanitizeFilename,
  buildFileTypeFilter,
  FILE_CATEGORIES
} from '@/app/utils/file-utils';
import { ExtendedFile, FileEntity, FileInfo } from '@/app/types';
import { existsSync } from 'fs';
import { Prisma } from '@prisma/client';
import fs from 'fs/promises';

// 上传目录
const UPLOAD_DIR = join(process.cwd(), 'uploads');

/**
 * 将文件实体转换为前端FileInfo对象
 */
export function mapFileEntityToFileInfo(file: FileEntity): FileInfo {
  return {
    id: file.id,
    name: file.name,
    type: file.type || 'unknown',
    size: file.size || 0,
    isFolder: file.isFolder,
    createdAt: file.createdAt.toISOString(),
    updatedAt: file.updatedAt.toISOString(),
    path: file.path,
    parentId: file.parentId,
    tags: file.tags || [],
    url: file.url || undefined,
  };
}

/**
 * 存储服务类
 * 提供文件和文件夹操作的所有方法
 */
export class StorageService {
  /**
   * 获取用户的文件列表
   */
  async getFiles(
    userId: string,
    folderId: string | null = null,
    type?: string | null,
    page = 1,
    pageSize = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  ): Promise<{ items: FileInfo[]; total: number; page: number; pageSize: number }> {
    try {
      // 构建基础查询条件
      let where: any = {
        uploaderId: userId,
        isDeleted: false,
      };

      // 如果指定了类型，进行类型筛选
      if (type) {
        where = {
          ...where,
          ...buildFileTypeFilter(type),
        };
      } else {
        // 如果没有指定类型，则显示当前文件夹下的内容
        where.parentId = folderId;
      }

      // 获取总记录数
      const total = await prisma.file.count({ where });

      // 构建排序条件
      const orderByArray: Prisma.FileOrderByWithRelationInput[] = [];
      
      // 文件夹始终优先显示
      if (sortBy !== 'isFolder') {
        orderByArray.push({ isFolder: Prisma.SortOrder.desc });
      }
      
      // 添加用户指定的排序
      const sortOrderValue = sortOrder.toLowerCase() === 'desc' ? Prisma.SortOrder.desc : Prisma.SortOrder.asc;
      orderByArray.push({ [sortBy]: sortOrderValue });

      // 获取分页数据
      const items = await prisma.file.findMany({
        where,
        orderBy: orderByArray,
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      // 如果是在进行类型筛选，获取文件的完整路径信息
      let processedItems = items;
      if (type) {
        // 获取所有文件夹信息用于构建路径
        const allFolders = await prisma.file.findMany({
          where: {
            uploaderId: userId,
            isFolder: true,
            isDeleted: false,
          },
          select: {
            id: true,
            name: true,
            parentId: true,
          },
        });

        // 构建文件夹映射
        const folderMap = new Map(allFolders.map(folder => [folder.id, folder]));

        // 为每个文件添加完整路径信息
        processedItems = items.map(item => {
          let currentParentId = item.parentId;
          const pathParts = [];

          // 构建路径
          while (currentParentId) {
            const parent = folderMap.get(currentParentId);
            if (parent) {
              pathParts.unshift(parent.name);
              currentParentId = parent.parentId;
            } else {
              break;
            }
          }

          // 完整路径
          const fullPath = pathParts.length > 0 ? `/${pathParts.join('/')}` : '/';

          return {
            ...item,
            fullPath,
          };
        });
      }

      // 返回文件列表信息
      return {
        items: processedItems.map(mapFileEntityToFileInfo),
        total,
        page,
        pageSize,
      };
    } catch (error) {
      console.error('获取文件列表失败:', error);
      throw new Error('获取文件列表失败');
    }
  }

  /**
   * 搜索文件
   */
  async searchFiles(
    userId: string,
    query: string,
    type?: string | null,
    tags?: string[]
  ): Promise<FileInfo[]> {
    try {
      // 构建基础查询条件
      const where: any = {
        uploaderId: userId,
        isDeleted: false,
      };

      // 添加搜索条件
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { filename: { contains: query, mode: 'insensitive' } },
      ];

      // 如果指定了类型，进行类型筛选
      if (type) {
        const typeFilter = buildFileTypeFilter(type);
        where.AND = where.AND || [];
        where.AND.push(typeFilter);
      }

      // 如果指定了标签，添加标签过滤
      if (tags && tags.length > 0) {
        where.tags = {
          hasSome: tags,
        };
      }

      // 执行查询
      const files = await prisma.file.findMany({
        where,
        orderBy: [
          { isFolder: 'desc' }, // 文件夹优先
          { createdAt: 'desc' }, // 最新创建
        ],
        take: 100, // 限制返回数量
      });

      // 返回结果
      return files.map(mapFileEntityToFileInfo);
    } catch (error) {
      console.error('搜索文件失败:', error);
      throw new Error('搜索文件失败');
    }
  }

  /**
   * 创建文件夹
   */
  async createFolder(
    userId: string,
    name: string,
    parentId: string | null = null,
    tags: string[] = []
  ): Promise<FileInfo> {
    try {
      // 清理文件夹名称
      const sanitizedName = sanitizeFilename(name);
      if (!sanitizedName) {
        throw new Error('文件夹名称无效');
      }

      // 处理标签 - 去除重复标签
      const uniqueTags = Array.isArray(tags)
        ? [...new Set(tags.filter(tag => tag && typeof tag === 'string' && tag.trim() !== ''))]
        : [];

      // 检查相同目录下是否已存在同名文件夹
      const existingFolder = await prisma.file.findFirst({
        where: {
          name: sanitizedName,
          parentId: parentId || null,
          uploaderId: userId,
          isFolder: true,
          isDeleted: false,
        },
      });

      if (existingFolder) {
        throw new Error(`文件夹 "${sanitizedName}" 已存在于当前目录`);
      }

      // 如果有父文件夹，验证其存在性和所有权
      let parentFolder = null;
      if (parentId) {
        parentFolder = await prisma.file.findFirst({
          where: {
            id: parentId,
            uploaderId: userId,
            isFolder: true,
            isDeleted: false,
          },
        });

        if (!parentFolder) {
          throw new Error('父文件夹不存在或无权限访问');
        }
      }

      // 生成文件夹路径
      let folderPath;
      if (parentFolder) {
        // 如果有父文件夹，将新文件夹路径添加到父文件夹路径后
        const parentPath = parentFolder.path.startsWith('/')
          ? parentFolder.path.substring(1)
          : parentFolder.path;
        folderPath = join(parentPath, sanitizedName).replace(/\\/g, '/');
      } else {
        // 如果是根目录，直接使用文件夹名
        folderPath = sanitizedName;
      }

      // 确保路径以/开头
      if (!folderPath.startsWith('/')) {
        folderPath = '/' + folderPath;
      }

      // 创建文件夹
      const folder = await prisma.file.create({
        data: {
          id: uuidv4(),
          name: sanitizedName,
          filename: sanitizedName,
          type: 'folder',
          size: 0,
          isFolder: true,
          uploaderId: userId,
          parentId: parentId || null,
          path: folderPath,
          tags: uniqueTags,
          url: null,
          updatedAt: new Date(),
        },
      });

      return mapFileEntityToFileInfo(folder);
    } catch (error) {
      console.error('创建文件夹失败:', error);
      throw error;
    }
  }

  /**
   * 上传文件
   */
  async uploadFile(
    userId: string,
    file: {
      name: string;
      type: string;
      size: number;
      arrayBuffer: () => Promise<ArrayBuffer>;
    },
    folderId: string | null = null,
    tags: string[] = [],
    originalFileName?: string
  ): Promise<FileInfo> {
    try {
      // 确保上传目录存在
      if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true });
      }

      // 使用提供的原始文件名或默认的文件名
      const fileName = originalFileName || file.name;
      
      // 清理文件名
      const originalName = sanitizeFilename(fileName);
      
      // 获取文件扩展名
      const extension = extname(originalName).substring(1);
      
      // 生成唯一文件名
      const uniqueFilename = generateUniqueFilename(originalName);
      
      // 完整的文件存储路径
      const filePath = join(UPLOAD_DIR, uniqueFilename);
      
      // 写入文件
      const buffer = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(buffer));

      // 获取文件类别
      const fileCategory = getFileCategory(file.type, extension);

      // 如果有父文件夹，验证其存在性和所有权
      let parentFolder = null;
      if (folderId) {
        parentFolder = await prisma.file.findFirst({
          where: {
            id: folderId,
            uploaderId: userId,
            isFolder: true,
            isDeleted: false,
          },
        });

        if (!parentFolder) {
          // 删除已上传的文件
          await unlink(filePath).catch(() => {});
          throw new Error('父文件夹不存在或无权限访问');
        }
      }

      // 处理标签 - 去除重复标签
      const uniqueTags = Array.isArray(tags)
        ? [...new Set(tags.filter(tag => tag && typeof tag === 'string' && tag.trim() !== ''))]
        : [];

      // 构建文件URL
      const fileUrl = `/api/storage/files/serve/${uniqueFilename}`;

      // 保存文件记录到数据库
      const fileRecord = await prisma.file.create({
        data: {
          id: uuidv4(),
          name: originalName,
          filename: uniqueFilename,
          type: fileCategory,
          size: file.size,
          isFolder: false,
          uploaderId: userId,
          parentId: folderId,
          path: parentFolder ? parentFolder.path : '/',
          tags: uniqueTags,
          url: fileUrl,
          updatedAt: new Date(),
        },
      });

      return mapFileEntityToFileInfo(fileRecord);
    } catch (error) {
      console.error('上传文件失败:', error);
      throw error;
    }
  }

  /**
   * 删除文件或文件夹
   */
  async deleteFiles(userId: string, fileIds: string[]): Promise<number> {
    try {
      // 验证文件存在且属于当前用户
      const filesToDelete = await prisma.file.findMany({
        where: {
          id: { in: fileIds },
          uploaderId: userId,
          isDeleted: false,
        },
      });

      if (filesToDelete.length === 0) {
        return 0;
      }

      // 收集所有要删除的文件夹ID
      const folderIds = filesToDelete
        .filter(file => file.isFolder)
        .map(folder => folder.id);

      // 查找这些文件夹下的所有文件和子文件夹
      let childrenToDelete: string[] = [];
      if (folderIds.length > 0) {
        // 递归查找所有子文件和文件夹
        const findChildren = async (parentIds: string[]): Promise<string[]> => {
          const children = await prisma.file.findMany({
            where: {
              parentId: { in: parentIds },
              uploaderId: userId,
              isDeleted: false,
            },
            select: {
              id: true,
              isFolder: true,
            },
          });

          const childIds = children.map(child => child.id);
          const childFolderIds = children
            .filter(child => child.isFolder)
            .map(folder => folder.id);

          if (childFolderIds.length > 0) {
            const grandChildren = await findChildren(childFolderIds);
            return [...childIds, ...grandChildren];
          }

          return childIds;
        };

        childrenToDelete = await findChildren(folderIds);
      }

      // 合并所有要删除的ID
      const allIdsToDelete = [...fileIds, ...childrenToDelete];

      // 执行删除操作（软删除）
      const result = await prisma.file.updateMany({
        where: {
          id: { in: allIdsToDelete },
          uploaderId: userId,
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      return result.count;
    } catch (error) {
      console.error('删除文件失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个文件信息
   */
  async getFile(userId: string, fileId: string): Promise<FileInfo> {
    try {
      const file = await prisma.file.findFirst({
        where: {
          id: fileId,
          uploaderId: userId,
          isDeleted: false,
        },
      });

      if (!file) {
        throw new Error('文件不存在或无权限访问');
      }

      return mapFileEntityToFileInfo(file);
    } catch (error) {
      console.error('获取文件失败:', error);
      throw error;
    }
  }

  /**
   * 更新文件信息
   */
  async updateFile(
    userId: string,
    fileId: string,
    updates: {
      name?: string;
      tags?: string[];
      lastModified?: Date;
      updatedAt?: Date;
      preserveOriginalType?: boolean;
    }
  ): Promise<FileInfo> {
    try {
      // 查找文件
      const file = await prisma.file.findFirst({
        where: {
          id: fileId,
          uploaderId: userId,
          isDeleted: false,
        },
      });

      if (!file) {
        throw new Error('文件不存在或无权限访问');
      }

      // 更新数据
      const updateData: any = {
        updatedAt: updates.updatedAt || updates.lastModified || new Date(),
      };

      // 更新文件名
      if (updates.name) {
        const sanitizedName = sanitizeFilename(updates.name);
        if (!sanitizedName) {
          throw new Error('文件名无效');
        }

        // 检查同一目录下是否已有同名文件
        const existingFile = await prisma.file.findFirst({
          where: {
            name: sanitizedName,
            parentId: file.parentId,
            uploaderId: userId,
            isFolder: file.isFolder,
            isDeleted: false,
            id: { not: fileId }, // 排除当前文件
          },
        });

        if (existingFile) {
          throw new Error(`${file.isFolder ? '文件夹' : '文件'} "${sanitizedName}" 已存在于当前目录`);
        }

        updateData.name = sanitizedName;
        
        // 记录文件类型保留信息
        console.log('文件更新 - 类型保留状态:', {
          preserveOriginalType: updates.preserveOriginalType,
          fileId: fileId,
          fileName: file.name,
          newName: sanitizedName,
          currentType: file.type
        });
        
        // 如果不是保留原始类型模式，根据新文件名更新类型
        if (!file.isFolder && !updates.preserveOriginalType) {
          // 获取新文件扩展名
          const extension = sanitizedName.includes('.') 
            ? sanitizedName.split('.').pop()?.toLowerCase() 
            : '';
            
          // 更新文件类型 (只有在未设置preserveOriginalType时)
          if (extension) {
            // 根据扩展名决定新的文件类型 - 这里可以保留原有的类型判断逻辑
            // 但不在此做类型更新
            console.log('保留原始文件类型，不根据扩展名更新类型');
          }
        } else if (!file.isFolder) {
          // 即使扩展名变化，也确保保留原始文件类型
          console.log('明确保留原始文件类型:', file.type);
          // 确保文件类型字段不变
          updateData.type = file.type;
        }
      }

      // 更新标签
      if (updates.tags) {
        const uniqueTags = Array.isArray(updates.tags)
          ? [...new Set(updates.tags.filter(tag => tag && typeof tag === 'string' && tag.trim() !== ''))]
          : [];
        updateData.tags = uniqueTags;
      }

      // 执行更新
      const updatedFile = await prisma.file.update({
        where: { id: fileId },
        data: updateData,
      });

      return mapFileEntityToFileInfo(updatedFile);
    } catch (error) {
      console.error('更新文件失败:', error);
      throw error;
    }
  }

  /**
   * 更新文件内容
   * 适用于文本文件的内容更新
   */
  async updateFileContent(
    userId: string,
    fileId: string,
    content: string
  ): Promise<FileInfo> {
    try {
      // 查找文件
      const file = await prisma.file.findFirst({
        where: {
          id: fileId,
          uploaderId: userId,
          isDeleted: false,
          isFolder: false, // 确保是文件而非文件夹
        },
      });

      if (!file) {
        throw new Error('文件不存在或无权限访问');
      }

      // 从URL获取文件名
      const filename = file.url ? path.basename(file.url) : null;
      
      if (!filename) {
        throw new Error('文件URL无效');
      }
      
      // 完整的文件存储路径
      const filePath = join(UPLOAD_DIR, filename);
      
      // 写入文件内容
      await writeFile(filePath, content, 'utf-8');
      
      // 更新文件元数据（最后修改时间）
      const updatedFile = await prisma.file.update({
        where: { id: fileId },
        data: {
          updatedAt: new Date(),
        },
      });

      return mapFileEntityToFileInfo(updatedFile);
    } catch (error) {
      console.error('更新文件内容失败:', error);
      throw error;
    }
  }

  /**
   * 移动文件或文件夹
   */
  async moveFiles(
    userId: string,
    fileIds: string[],
    targetFolderId: string | null
  ): Promise<number> {
    try {
      // 验证目标文件夹存在且属于当前用户
      if (targetFolderId) {
        const targetFolder = await prisma.file.findFirst({
          where: {
            id: targetFolderId,
            uploaderId: userId,
            isFolder: true,
            isDeleted: false,
          },
        });

        if (!targetFolder) {
          throw new Error('目标文件夹不存在或无权限访问');
        }

        // 检查是否尝试将文件夹移动到其自身或其子文件夹中
        const isMovingToSelfOrChild = async (folderId: string): Promise<boolean> => {
          if (folderId === targetFolderId) {
            return true;
          }

          // 递归检查是否是子文件夹
          const checkIsChild = async (currentId: string, checkId: string): Promise<boolean> => {
            const folder = await prisma.file.findUnique({
              where: { id: currentId },
              select: { parentId: true },
            });

            if (!folder || !folder.parentId) {
              return false;
            }

            if (folder.parentId === checkId) {
              return true;
            }

            return checkIsChild(folder.parentId, checkId);
          };

          return checkIsChild(targetFolderId, folderId);
        };

        // 验证文件夹不会移动到自己或子文件夹中
        const filesToMove = await prisma.file.findMany({
          where: {
            id: { in: fileIds },
            uploaderId: userId,
            isDeleted: false,
          },
          select: {
            id: true,
            isFolder: true,
            name: true,
          },
        });

        for (const file of filesToMove) {
          if (file.isFolder && (await isMovingToSelfOrChild(file.id))) {
            throw new Error(`无法将文件夹 "${file.name}" 移动到自身或其子文件夹中`);
          }
        }

        // 检查目标文件夹中是否有同名文件或文件夹
        const existingFiles = await prisma.file.findMany({
          where: {
            parentId: targetFolderId,
            uploaderId: userId,
            isDeleted: false,
          },
          select: {
            name: true,
            isFolder: true,
          },
        });

        const existingNames = new Set(existingFiles.map(f => `${f.name}:${f.isFolder}`));

        for (const file of filesToMove) {
          if (existingNames.has(`${file.name}:${file.isFolder}`)) {
            throw new Error(`目标文件夹中已存在同名${file.isFolder ? '文件夹' : '文件'} "${file.name}"`);
          }
        }
      }

      // 执行移动操作
      const result = await prisma.file.updateMany({
        where: {
          id: { in: fileIds },
          uploaderId: userId,
          isDeleted: false,
        },
        data: {
          parentId: targetFolderId,
          updatedAt: new Date(),
        },
      });

      return result.count;
    } catch (error) {
      console.error('移动文件失败:', error);
      throw error;
    }
  }

  /**
   * 将文件添加到收藏
   */
  async addToFavorites(userId: string, fileIds: string[]): Promise<number> {
    try {
      let addedCount = 0;
      
      // 获取已有的收藏记录
      const existingFavorites = await prisma.favorite.findMany({
        where: {
          userId,
          fileId: { in: fileIds }
        },
        select: {
          fileId: true
        }
      });
      
      // 已收藏的文件ID
      const existingFavoriteIds = new Set(existingFavorites.map(fav => fav.fileId));
      
      // 过滤出未收藏的文件ID
      const newFavoriteIds = fileIds.filter(id => !existingFavoriteIds.has(id));
      
      // 如果有新的收藏，批量创建
      if (newFavoriteIds.length > 0) {
        // 验证文件存在且属于当前用户
        const files = await prisma.file.findMany({
          where: {
            id: { in: newFavoriteIds },
            uploaderId: userId,
            isDeleted: false
          },
          select: {
            id: true
          }
        });
        
        // 只收藏存在的文件
        const validFileIds = files.map(file => file.id);
        
        if (validFileIds.length > 0) {
          // 创建收藏记录
          const result = await prisma.favorite.createMany({
            data: validFileIds.map(fileId => ({
              id: uuidv4(),
              userId,
              fileId,
              createdAt: new Date()
            })),
            skipDuplicates: true
          });
          
          addedCount = result.count;
        }
      }
      
      return addedCount;
    } catch (error) {
      console.error('添加收藏失败:', error);
      throw error;
    }
  }
  
  /**
   * 从收藏中移除文件
   */
  async removeFromFavorites(userId: string, fileIds: string[]): Promise<number> {
    try {
      // 删除收藏记录
      const result = await prisma.favorite.deleteMany({
        where: {
          userId,
          fileId: { in: fileIds }
        }
      });
      
      return result.count;
    } catch (error) {
      console.error('移除收藏失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取收藏的文件列表
   */
  async getFavorites(
    userId: string,
    page = 1,
    pageSize = 50
  ): Promise<{ items: FileInfo[]; total: number; page: number; pageSize: number }> {
    try {
      // 获取总记录数
      const total = await prisma.favorite.count({
        where: {
          userId
        }
      });
      
      // 获取收藏记录及关联的文件信息
      const favorites = await prisma.favorite.findMany({
        where: {
          userId
        },
        include: {
          file: true
        },
        orderBy: {
          createdAt: Prisma.SortOrder.desc
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      });
      
      // 过滤出未删除的文件
      const validFiles = favorites
        .filter(fav => fav.file && !fav.file.isDeleted)
        .map(fav => fav.file as FileEntity); // 明确类型转换
      
      return {
        items: validFiles.map(file => mapFileEntityToFileInfo(file)),
        total,
        page,
        pageSize
      };
    } catch (error) {
      console.error('获取收藏列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取存储统计信息
   */
  async getStorageStats(userId: string): Promise<{
    totalSize: number;
    usedSize: number;
    fileCount: number;
    folderCount: number;
  }> {
    try {
      // 获取文件数量和总大小
      const fileStats = await prisma.file.aggregate({
        where: {
          uploaderId: userId,
          isDeleted: false,
        },
        _count: {
          id: true,
        },
        _sum: {
          size: true,
        },
      });
      
      // 获取文件夹数量
      const folderCount = await prisma.file.count({
        where: {
          uploaderId: userId,
          isDeleted: false,
          isFolder: true,
        },
      });
      
      // 获取文件数量
      const fileCount = await prisma.file.count({
        where: {
          uploaderId: userId,
          isDeleted: false,
          isFolder: false,
        },
      });
      
      // 默认配额 (可从用户表或配置中获取)
      const totalSize = 10 * 1024 * 1024 * 1024; // 10GB
      
      return {
        totalSize,
        usedSize: fileStats._sum.size || 0,
        fileCount,
        folderCount,
      };
    } catch (error) {
      console.error('获取存储统计失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取最近访问的文件
   */
  async getRecentFiles(userId: string, limit = 10): Promise<FileInfo[]> {
    try {
      // 获取最近更新的文件
      const recentFiles = await prisma.file.findMany({
        where: {
          uploaderId: userId,
          isDeleted: false,
          isFolder: false, // 只显示文件
        },
        orderBy: {
          updatedAt: Prisma.SortOrder.desc
        },
        take: limit,
      });
      
      return recentFiles.map(mapFileEntityToFileInfo);
    } catch (error) {
      console.error('获取最近文件失败:', error);
      throw error;
    }
  }

  /**
   * 重命名文件或文件夹
   */
  async renameFile(
    fileId: string,
    newName: string,
    userId: string,
    tags?: string[]
  ): Promise<FileInfo> {
    try {
      // 清理文件名称
      const sanitizedName = sanitizeFilename(newName);
      if (!sanitizedName) {
        throw new Error('文件名称无效');
      }

      // 处理标签 - 去除重复标签
      const uniqueTags = Array.isArray(tags)
        ? [...new Set(tags.filter(tag => tag && typeof tag === 'string' && tag.trim() !== ''))]
        : undefined;

      // 查找文件并验证所有权
      const file = await prisma.file.findFirst({
        where: {
          id: fileId,
          uploaderId: userId,
          isDeleted: false,
        },
      });

      if (!file) {
        throw new Error('文件不存在或您没有权限操作此文件');
      }

      // 检查同一目录下是否已存在同名文件/文件夹
      const existingFile = await prisma.file.findFirst({
        where: {
          name: sanitizedName,
          parentId: file.parentId,
          uploaderId: userId,
          isFolder: file.isFolder, // 同类型检查（文件夹只检查同名文件夹，文件只检查同名文件）
          id: { not: fileId }, // 排除当前文件/文件夹自身
          isDeleted: false,
        },
      });

      if (existingFile) {
        throw new Error(`同一目录下已存在同名${file.isFolder ? '文件夹' : '文件'}`);
      }

      // 判断是否是文件夹
      if (file.isFolder) {
        // 更新文件夹名称和标签
        const updatedFolder = await prisma.file.update({
          where: { id: fileId },
          data: {
            name: sanitizedName,
            tags: uniqueTags || file.tags,
          },
        });

        return mapFileEntityToFileInfo(updatedFolder);
      }

      // 如果是文件，需要处理物理文件的重命名
      // 获取文件扩展名
      const oldExtension = file.name.includes('.') ? file.name.split('.').pop() : '';
      const fileNameWithoutExt = file.name.includes('.')
        ? file.name.substring(0, file.name.lastIndexOf('.'))
        : file.name;
      
      const newNameWithoutExt = sanitizedName.includes('.')
        ? sanitizedName.substring(0, sanitizedName.lastIndexOf('.'))
        : sanitizedName;
        
      const newExtension = sanitizedName.includes('.') ? sanitizedName.split('.').pop() : oldExtension;
      
      // 构建新的文件名，保持原始文件唯一标识
      const oldFilename = file.filename || '';
      const uniquePart = oldFilename.includes('_') ? oldFilename.split('_')[0] : '';
      const newFilename = uniquePart 
        ? `${uniquePart}_${newNameWithoutExt}.${newExtension}`
        : `${newNameWithoutExt}.${newExtension}`;
      
      // 检查文件是否存储在上传目录
      let physicalFilePath = file.path;
      let newPhysicalPath;
      
      // 确保我们使用真实的物理文件路径，而不是相对路径或逻辑路径
      if (existsSync(join(UPLOAD_DIR, oldFilename))) {
        // 如果文件在上传目录中
        physicalFilePath = join(UPLOAD_DIR, oldFilename);
        newPhysicalPath = join(UPLOAD_DIR, newFilename);
      } else if (existsSync(file.path)) {
        // 如果文件路径是绝对路径
        const dirName = path.dirname(file.path);
        // 安全检查：确保目录路径不是根目录
        if (dirName === '/' || dirName.match(/^[A-Z]:\\$/i)) {
          console.error('不能重命名根目录中的文件:', file.path);
          // 只更新数据库记录，不尝试重命名物理文件
          newPhysicalPath = file.path; // 保持原路径
        } else {
          newPhysicalPath = join(dirName, newFilename);
        }
      } else {
        // 文件不存在，只更新数据库
        console.log('物理文件不存在，只更新数据库记录:', file.path);
        newPhysicalPath = file.path.replace(path.basename(file.path), newFilename);
      }
      
      console.log('重命名文件路径:', {
        原路径: physicalFilePath,
        新路径: newPhysicalPath
      });
      
      // 如果物理文件存在且路径不同，则重命名物理文件
      if (existsSync(physicalFilePath) && physicalFilePath !== newPhysicalPath) {
        try {
          await fs.rename(physicalFilePath, newPhysicalPath);
          console.log('物理文件重命名成功:', physicalFilePath, '->', newPhysicalPath);
        } catch (fsError) {
          console.error('文件系统操作错误:', fsError);
          // 文件重命名失败，但仍然更新数据库记录
        }
      }
      
      // 构建新的文件URL
      let newUrl = file.url;
      if (newUrl) {
        // 替换URL中的文件名部分
        const urlParts = newUrl.split('/');
        urlParts[urlParts.length - 1] = newFilename;
        newUrl = urlParts.join('/');
      }
      
      // 更新文件记录
      const updatedFile = await prisma.file.update({
        where: { id: fileId },
        data: {
          name: sanitizedName, // 更新显示名称
          filename: newFilename, // 更新文件名
          path: newPhysicalPath, // 更新文件路径
          url: newUrl, // 更新URL
          tags: uniqueTags || file.tags, // 使用去重后的标签
        },
      });

      return mapFileEntityToFileInfo(updatedFile);
    } catch (error) {
      console.error('重命名文件失败:', error);
      throw error;
    }
  }
} 