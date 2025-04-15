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
} from '@/app/utils/file/type';
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
          { isFolder: 'desc' },
          { updatedAt: 'desc' }
        ],
        take: 50 // 限制返回的结果数量
      });

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
      // 参数验证
      if (!name || !name.trim()) {
        throw new Error('文件夹名称不能为空');
      }

      // 清理文件夹名称
      const sanitizedName = sanitizeFilename(name.trim());
      if (!sanitizedName) {
        throw new Error('文件夹名称包含不允许的字符');
      }

      // 确保唯一的标签
      const uniqueTags = Array.from(new Set(tags.filter(tag => tag && tag.trim())));

      // 如果有父文件夹，检查父文件夹是否存在且属于该用户
      if (parentId) {
        const parentFolder = await prisma.file.findFirst({
          where: {
            id: parentId,
            uploaderId: userId,
            isFolder: true,
            isDeleted: false,
          },
        });

        if (!parentFolder) {
          throw new Error('父文件夹不存在或您没有权限在该位置创建文件夹');
        }

        // 检查同一目录下是否已有同名文件夹
        const existingFolder = await prisma.file.findFirst({
          where: {
            name: sanitizedName,
            parentId: parentId,
            uploaderId: userId,
            isFolder: true,
            isDeleted: false,
          },
        });

        if (existingFolder) {
          throw new Error('该目录下已存在同名文件夹');
        }
      } else {
        // 检查根目录下是否已有同名文件夹
        const existingFolder = await prisma.file.findFirst({
          where: {
            name: sanitizedName,
            parentId: null,
            uploaderId: userId,
            isFolder: true,
            isDeleted: false,
          },
        });

        if (existingFolder) {
          throw new Error('根目录下已存在同名文件夹');
        }
      }

      // 创建文件夹记录
      const folder = await prisma.file.create({
        data: {
          id: uuidv4(),
          name: sanitizedName,
          parentId: parentId,
          uploaderId: userId,
          isFolder: true,
          isDeleted: false,
          type: 'folder',
          size: 0,
          tags: uniqueTags,
          filename: sanitizedName, // 文件夹的filename与name相同
          path: '', // 文件夹没有物理路径
          updatedAt: new Date(),
          createdAt: new Date(),
        },
      });

      return mapFileEntityToFileInfo(folder);
    } catch (error) {
      console.error('创建文件夹失败:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('创建文件夹失败');
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
      // 使用提供的原始文件名或从文件对象获取
      const fileName = originalFileName || file.name;
      
      // 清理文件名
      const sanitizedName = sanitizeFilename(fileName);
      if (!sanitizedName) {
        throw new Error('文件名包含不允许的字符');
      }

      // 确保唯一的标签
      const uniqueTags = Array.from(new Set(tags.filter(tag => tag && tag.trim())));

      // 如果有父文件夹，检查父文件夹是否存在且属于该用户
      if (folderId) {
        const parentFolder = await prisma.file.findFirst({
          where: {
            id: folderId,
            uploaderId: userId,
            isFolder: true,
            isDeleted: false,
          },
        });

        if (!parentFolder) {
          throw new Error('父文件夹不存在或您没有权限在该位置上传文件');
        }

        // 检查同一目录下是否已有同名文件
        const existingFile = await prisma.file.findFirst({
          where: {
            name: sanitizedName,
            parentId: folderId,
            uploaderId: userId,
            isFolder: false,
            isDeleted: false,
          },
        });

        if (existingFile) {
          throw new Error('该目录下已存在同名文件');
        }
      } else {
        // 检查根目录下是否已有同名文件
        const existingFile = await prisma.file.findFirst({
          where: {
            name: sanitizedName,
            parentId: null,
            uploaderId: userId,
            isFolder: false,
            isDeleted: false,
          },
        });

        if (existingFile) {
          throw new Error('根目录下已存在同名文件');
        }
      }

      // 确保上传目录存在
      if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true });
      }

      // 确保用户目录存在
      const userUploadDir = join(UPLOAD_DIR, userId);
      if (!existsSync(userUploadDir)) {
        await mkdir(userUploadDir, { recursive: true });
      }

      // 生成唯一的文件名
      const uniqueFilename = generateUniqueFilename(sanitizedName);
      
      // 构建文件的物理路径
      const filePath = join(userUploadDir, uniqueFilename);
      
      // 获取文件的二进制数据
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // 写入文件
      await writeFile(filePath, buffer);

      // 获取文件类型
      const fileType = file.type || 'application/octet-stream';
      const category = getFileCategory(fileType, sanitizedName);

      // 创建文件记录
      const fileRecord = await prisma.file.create({
        data: {
          id: uuidv4(),
          name: sanitizedName,
          parentId: folderId,
          uploaderId: userId,
          isFolder: false,
          isDeleted: false,
          type: fileType,
          size: file.size,
          tags: uniqueTags,
          filename: uniqueFilename,
          path: `uploads/${userId}/${uniqueFilename}`,
          updatedAt: new Date(),
          createdAt: new Date(),
        },
      });

      return mapFileEntityToFileInfo(fileRecord);
    } catch (error) {
      console.error('上传文件失败:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('上传文件失败');
    }
  }

  /**
   * 删除文件或文件夹（支持批量删除）
   */
  async deleteFiles(userId: string, fileIds: string[]): Promise<number> {
    try {
      if (!fileIds?.length) {
        return 0;
      }

      let totalDeleted = 0;
      const filesToDelete = new Set(fileIds);
      const processedFiles = new Set<string>();
      
      // 递归查找子文件和文件夹
      // 注意：这里使用异步函数在循环中，但实际上我们需要等待所有递归完成
      // 因此需要特别注意
      const findChildren = async (parentIds: string[]): Promise<string[]> => {
        if (!parentIds.length) return [];
        
        const children = await prisma.file.findMany({
          where: {
            parentId: { in: parentIds },
            uploaderId: userId,
            isDeleted: false,
          },
          select: { id: true, isFolder: true },
        });

        const childIds = children.map(c => c.id);
        const folderIds = children.filter(c => c.isFolder).map(c => c.id);
        
        // 递归查找更深层级的子文件
        if (folderIds.length) {
          const deeperChildren = await findChildren(folderIds);
          return [...childIds, ...deeperChildren];
        }
        
        return childIds;
      };
      
      // 查找所有要删除的文件夹的子文件
      const folderIds = await prisma.file.findMany({
        where: {
          id: { in: Array.from(filesToDelete) },
          uploaderId: userId,
          isFolder: true,
          isDeleted: false,
        },
        select: { id: true },
      });
      
      // 如果有文件夹，递归查找所有子文件
      if (folderIds.length) {
        const childIds = await findChildren(folderIds.map(f => f.id));
        for (const id of childIds) {
          filesToDelete.add(id);
        }
      }
      
      // 批量更新数据库标记文件为已删除
      const result = await prisma.file.updateMany({
        where: {
          id: { in: Array.from(filesToDelete) },
          uploaderId: userId,
          isDeleted: false,
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
      
      return result.count;
    } catch (error) {
      console.error('删除文件失败:', error);
      throw new Error('删除文件失败');
    }
  }

  /**
   * 获取文件详情
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
        throw new Error('文件不存在或您没有权限访问');
      }

      return mapFileEntityToFileInfo(file);
    } catch (error) {
      console.error('获取文件详情失败:', error);
      throw new Error('获取文件详情失败');
    }
  }

  /**
   * 更新文件元数据
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
      const file = await prisma.file.findFirst({
        where: {
          id: fileId,
          uploaderId: userId,
          isDeleted: false,
        },
      });

      if (!file) {
        throw new Error('文件不存在或您没有权限更新');
      }

      const updateData: any = {};

      // 更新名称
      if (updates.name) {
        const sanitizedName = sanitizeFilename(updates.name);
        if (!sanitizedName) {
          throw new Error('文件名包含不允许的字符');
        }

        // 检查同一目录下是否已有同名文件
        const existingFile = await prisma.file.findFirst({
          where: {
            name: sanitizedName,
            parentId: file.parentId,
            uploaderId: userId,
            isFolder: file.isFolder,
            id: { not: fileId }, // 排除当前文件
            isDeleted: false,
          },
        });

        if (existingFile) {
          throw new Error(`该目录下已存在同名${file.isFolder ? '文件夹' : '文件'}`);
        }

        updateData.name = sanitizedName;
      }

      // 更新标签
      if (updates.tags) {
        updateData.tags = Array.from(new Set(updates.tags.filter(tag => tag && tag.trim())));
      }

      // 设置最后修改时间
      if (updates.lastModified) {
        updateData.lastModified = updates.lastModified;
      }

      // 设置更新时间
      if (updates.updatedAt) {
        updateData.updatedAt = updates.updatedAt;
      } else {
        updateData.updatedAt = new Date();
      }

      // 如果文件名发生了变化且不是文件夹，我们需要处理文件类型
      if (updates.name && !file.isFolder && !updates.preserveOriginalType) {
        const nameWithExt = updates.name;
        const ext = extname(nameWithExt).toLowerCase();
        
        if (ext) {
          // 保留获取文件类别的逻辑，但不再存储到数据库中
          const mimeType = file.type || ''; // 添加空字符串作为备选
          getFileCategory(mimeType, nameWithExt); // 调用函数但不使用返回值
        }
      }

      // 更新文件记录
      const updatedFile = await prisma.file.update({
        where: { id: fileId },
        data: updateData,
      });

      return mapFileEntityToFileInfo(updatedFile);
    } catch (error) {
      console.error('更新文件失败:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('更新文件失败');
    }
  }

  /**
   * 更新文件内容
   */
  async updateFileContent(
    userId: string,
    fileId: string,
    content: string
  ): Promise<FileInfo> {
    try {
      // 查找文件并验证所有权
      const file = await prisma.file.findFirst({
        where: {
          id: fileId,
          uploaderId: userId,
          isFolder: false, // 确保不是文件夹
          isDeleted: false,
        },
      });

      if (!file) {
        throw new Error('文件不存在或您没有权限更新');
      }

      // 验证文件是否为文本类型
      if (file.type && (
          !file.type.startsWith('text/') && 
          !file.type.includes('javascript') && 
          !file.type.includes('json') &&
          !file.type.includes('xml') &&
          !file.type.includes('html'))
      ) {
        throw new Error('只能更新文本类型的文件内容');
      }

      // 获取完整文件路径
      const filePath = join(process.cwd(), file.path);

      // 写入新内容
      await writeFile(filePath, content);

      // 获取新的文件大小
      const stats = await fs.stat(filePath);
      const newSize = stats.size;

      // 更新文件记录
      const updatedFile = await prisma.file.update({
        where: { id: fileId },
        data: {
          size: newSize,
          updatedAt: new Date(),
        },
      });

      return mapFileEntityToFileInfo(updatedFile);
    } catch (error) {
      console.error('更新文件内容失败:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('更新文件内容失败');
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
      if (!fileIds?.length) {
        return 0;
      }

      // 验证目标文件夹（如果不是移动到根目录）
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
          throw new Error('目标文件夹不存在或您没有权限');
        }

        // 检查是否尝试将文件夹移动到其自身或其子文件夹中
        // 这是一个递归检查
        const isMovingToSelfOrChild = async (folderId: string): Promise<boolean> => {
          if (targetFolderId === folderId) {
            return true;
          }

          const checkIsChild = async (currentId: string, checkId: string): Promise<boolean> => {
            const parent = await prisma.file.findFirst({
              where: { id: currentId },
              select: { parentId: true },
            });

            if (!parent || parent.parentId === null) {
              return false;
            }

            if (parent.parentId === checkId) {
              return true;
            }

            return checkIsChild(parent.parentId, checkId);
          };

          return checkIsChild(targetFolderId, folderId);
        };

        // 获取要移动的文件夹ID列表
        const foldersToMove = await prisma.file.findMany({
          where: {
            id: { in: fileIds },
            uploaderId: userId,
            isFolder: true,
            isDeleted: false,
          },
          select: { id: true },
        });

        // 检查每个文件夹是否会导致循环引用
        for (const folder of foldersToMove) {
          const isCyclic = await isMovingToSelfOrChild(folder.id);
          if (isCyclic) {
            throw new Error('不能将文件夹移动到其自身或其子文件夹中');
          }
        }
      }

      // 获取要移动的文件列表
      const filesToMove = await prisma.file.findMany({
        where: {
          id: { in: fileIds },
          uploaderId: userId,
          isDeleted: false,
        },
        select: { id: true, name: true, isFolder: true },
      });

      // 检查目标文件夹中是否有同名文件
      if (targetFolderId !== null) {
        const existingFiles = await prisma.file.findMany({
          where: {
            parentId: targetFolderId,
            uploaderId: userId,
            isDeleted: false,
          },
          select: { name: true, isFolder: true },
        });

        // 建立查找映射
        const existingMap = new Map();
        for (const file of existingFiles) {
          existingMap.set(`${file.name}-${file.isFolder}`, true);
        }

        // 检查每个要移动的文件是否会与目标文件夹中的文件冲突
        for (const file of filesToMove) {
          const key = `${file.name}-${file.isFolder}`;
          if (existingMap.has(key)) {
            throw new Error(`目标文件夹中已存在同名${file.isFolder ? '文件夹' : '文件'}: ${file.name}`);
          }
        }
      }

      // 批量更新文件记录
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
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('移动文件失败');
    }
  }

  /**
   * 添加文件到收藏夹
   */
  async addToFavorites(userId: string, fileIds: string[]): Promise<number> {
    try {
      if (!fileIds?.length) {
        return 0;
      }

      // 验证文件存在并属于用户
      const filesToAdd = await prisma.file.findMany({
        where: {
          id: { in: fileIds },
          uploaderId: userId,
          isDeleted: false,
        },
        select: { id: true },
      });

      if (!filesToAdd.length) {
        throw new Error('没有找到要收藏的文件');
      }

      const validFileIds = filesToAdd.map(f => f.id);

      // 查找已经收藏的文件
      const existingFavorites = await prisma.favorite.findMany({
        where: {
          userId,
          fileId: { in: validFileIds },
        },
        select: { fileId: true },
      });

      const existingFavoriteIds = new Set(existingFavorites.map(f => f.fileId));
      
      // 过滤出未收藏的文件ID
      const newFavoriteIds = validFileIds.filter(id => !existingFavoriteIds.has(id));

      if (!newFavoriteIds.length) {
        return 0; // 所有文件已经收藏
      }

      // 批量创建收藏记录
      const result = await prisma.$transaction(
        newFavoriteIds.map(fileId => 
          prisma.favorite.create({
            data: {
              userId,
              fileId,
            },
          })
        )
      );

      return result.length;
    } catch (error) {
      console.error('添加到收藏夹失败:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('添加到收藏夹失败');
    }
  }

  /**
   * 从收藏夹移除文件
   */
  async removeFromFavorites(userId: string, fileIds: string[]): Promise<number> {
    try {
      if (!fileIds?.length) {
        return 0;
      }

      // 批量删除收藏记录
      const result = await prisma.favorite.deleteMany({
        where: {
          userId,
          fileId: { in: fileIds },
        },
      });

      return result.count;
    } catch (error) {
      console.error('从收藏夹移除失败:', error);
      throw new Error('从收藏夹移除失败');
    }
  }

  /**
   * 获取收藏夹文件列表
   */
  async getFavorites(
    userId: string,
    page = 1,
    pageSize = 50
  ): Promise<{ items: FileInfo[]; total: number; page: number; pageSize: number }> {
    try {
      // 获取总记录数
      const total = await prisma.favorite.count({
        where: { userId },
      });

      // 获取分页数据
      const favorites = await prisma.favorite.findMany({
        where: { userId },
        include: {
          file: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      });

      // 过滤出有效的文件（没有被删除的）
      const validFiles = favorites
        .map(f => f.file)
        .filter(file => file && !file.isDeleted) as FileEntity[];  // 使用类型断言确保兼容性

      return {
        items: validFiles.map(mapFileEntityToFileInfo),
        total,
        page,
        pageSize,
      };
    } catch (error) {
      console.error('获取收藏夹失败:', error);
      throw new Error('获取收藏夹失败');
    }
  }

  /**
   * 获取用户存储统计信息
   */
  async getStorageStats(userId: string): Promise<{
    totalSize: number;
    usedSize: number;
    fileCount: number;
    folderCount: number;
  }> {
    try {
      // 计算用户的文件总数
      const fileCount = await prisma.file.count({
        where: {
          uploaderId: userId,
          isFolder: false,
          isDeleted: false,
        },
      });

      // 计算用户的文件夹总数
      const folderCount = await prisma.file.count({
        where: {
          uploaderId: userId,
          isFolder: true,
          isDeleted: false,
        },
      });

      // 计算用户已使用的存储空间
      const usedSizeResult = await prisma.file.aggregate({
        where: {
          uploaderId: userId,
          isFolder: false, // 只计算文件的大小
          isDeleted: false,
        },
        _sum: {
          size: true,
        },
      });

      const usedSize = usedSizeResult._sum.size || 0;
      
      // 默认总存储大小为10GB (10 * 1024 * 1024 * 1024字节)
      const totalSize = 10 * 1024 * 1024 * 1024;

      return {
        totalSize,
        usedSize,
        fileCount,
        folderCount,
      };
    } catch (error) {
      console.error('获取存储统计信息失败:', error);
      throw new Error('获取存储统计信息失败');
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
          isFolder: false, // 只返回文件
          isDeleted: false,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: limit,
      });

      return recentFiles.map(mapFileEntityToFileInfo);
    } catch (error) {
      console.error('获取最近文件失败:', error);
      throw new Error('获取最近文件失败');
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
      const newExtension = sanitizedName.includes('.') ? sanitizedName.split('.').pop() : '';
      
      // 更新文件记录
      const updateData: any = {
        name: sanitizedName,
      };
      
      // 只有在提供了标签时才更新标签
      if (uniqueTags) {
        updateData.tags = uniqueTags;
      }
      
      // 如果文件扩展名变化了，可能需要更新文件类型和分类
      if (oldExtension !== newExtension) {
        const fileType = file.type || ''; // 添加空字符串作为备选
        getFileCategory(fileType, sanitizedName); // 调用函数但不使用返回值
      }
      
      // 更新数据库记录
      const updatedFile = await prisma.file.update({
        where: { id: fileId },
        data: updateData,
      });
      
      return mapFileEntityToFileInfo(updatedFile);
    } catch (error) {
      console.error('重命名文件失败:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('重命名文件失败');
    }
  }
} 