/**
 * 文件管理服务
 * 提供文件和文件夹的管理功能，如列表查询、移动、删除等
 */
import { prisma } from '@/app/lib/database';
import { Prisma } from '@prisma/client';
import { join } from 'path';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { FileInfo } from '@/app/types';
import { buildFileTypeFilter } from '@/app/utils/file/type';
import { createFileError, safeAsync } from '@/app/utils/error';
import { mapFileEntityToFileInfo } from './file-upload-service';

// 上传目录
const UPLOAD_DIR = join(process.cwd(), 'uploads');

/**
 * 文件管理服务类
 * 负责文件和文件夹的管理功能
 */
export class FileManagementService {
  
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
    sortOrder = 'desc',
    includeFolder = false
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
          ...buildFileTypeFilter(type, includeFolder),
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
      throw createFileError('access', '获取文件列表失败');
    }
  }

  /**
   * 搜索文件
   * @param userId 用户ID
   * @param query 搜索关键词
   * @param type 文件类型过滤
   * @param tags 标签过滤
   * @param includeFolder 是否包含文件夹
   * @param searchMode 搜索模式: 'name'=按名称搜索, 'tag'=按标签搜索
   */
  async searchFiles(
    userId: string,
    query: string,
    type?: string | null,
    tags?: string[],
    includeFolder: boolean = true,
    searchMode: 'name' | 'tag' = 'name'
  ): Promise<FileInfo[]> {
    try {
      console.log(`[文件管理] 开始搜索, 模式: ${searchMode}, 关键词: "${query}", 包含文件夹: ${includeFolder}`);
      
      // 构建基础查询条件
      const where: any = {
        uploaderId: userId,
        isDeleted: false,
      };

      // 根据搜索模式构建查询条件
      if (searchMode === 'tag') {
        // 按标签搜索: 将查询词作为标签查找
        where.tags = {
          hasSome: [query.trim()],
        };
        console.log(`[文件管理] 标签搜索: "${query}"`);
      } else {
        // 按名称搜索: 只在显示名称中查找，不再查找filename字段
        where.name = { contains: query.trim(), mode: 'insensitive' };
        console.log(`[文件管理] 名称搜索: "${query}" (仅匹配显示名称)`);
      }

      // 如果不包含文件夹，添加过滤条件
      if (!includeFolder) {
        where.isFolder = false;
        console.log('[文件管理] 只搜索文件,不包含文件夹');
      }

      // 如果指定了文件类型，添加类型过滤
      if (type) {
        const typeFilter = buildFileTypeFilter(type, includeFolder);
        where.AND = where.AND || [];
        where.AND.push(typeFilter);
        console.log(`[文件管理] 添加类型过滤: ${type}, 包含文件夹: ${includeFolder}`);
      }

      // 如果提供了额外标签过滤(与搜索标签不同)
      if (tags && tags.length > 0) {
        // 使用AND条件避免覆盖之前的查询
        where.AND = where.AND || [];
        where.AND.push({
          tags: {
            hasSome: tags.map(t => t.trim()).filter(t => t)
          }
        });
        console.log(`[文件管理] 添加额外标签过滤: ${tags.join(', ')}`);
      }

      console.log('[文件管理] 最终查询条件:', JSON.stringify(where, null, 2));

      // 执行查询
      const files = await prisma.file.findMany({
        where,
        orderBy: [
          { isFolder: 'desc' },  // 文件夹优先显示
          { updatedAt: 'desc' }  // 按更新时间排序
        ],
        take: 100, // 最多返回100条
      });

      // 记录结果信息
      const folderCount = files.filter(f => f.isFolder).length;
      const fileCount = files.length - folderCount;
      console.log(`[文件管理] 搜索完成, 结果: ${files.length}项 (文件夹:${folderCount}, 文件:${fileCount})`);

      // 返回结果
      return files.map(mapFileEntityToFileInfo);
    } catch (error) {
      console.error('[文件管理] 搜索文件失败:', error);
      throw createFileError('access', '搜索文件失败');
    }
  }

  /**
   * 获取单个文件信息
   */
  async getFile(userId: string, fileId: string): Promise<FileInfo> {
    try {
      // 首先检查文件是否存在
      const file = await prisma.file.findFirst({
        where: {
          id: fileId,
          isDeleted: false,
        },
      });

      if (!file) {
        throw createFileError('access', '文件不存在');
      }

      // 检查文件权限
      const hasAccess = await prisma.fileShareFile.findFirst({
        where: {
          fileId,
          share: {
            OR: [
              { userId }, // 用户是分享者
              { 
                AND: [
                  { expiresAt: { gt: new Date() } }, // 未过期
                  { accessLimit: { gt: 0 } }, // 有访问限制
                ]
              }
            ]
          }
        },
      });

      // 如果用户不是上传者且没有分享权限
      if (file.uploaderId !== userId && !hasAccess) {
        // 检查是否有有效的分享链接
        const hasShareLink = await prisma.fileShareFile.findFirst({
          where: {
            fileId,
            share: {
              expiresAt: { gt: new Date() },
              accessLimit: { gt: 0 }
            }
          }
        });

        if (!hasShareLink) {
          throw createFileError('access', '无权访问此文件');
        }
      }

      return mapFileEntityToFileInfo(file);
    } catch (error) {
      console.error('获取文件信息失败:', error);
      if (error.type === 'file_access') {
        throw error;
      }
      throw createFileError('access', '获取文件信息失败');
    }
  }

  /**
   * 删除文件
   */
  async deleteFiles(userId: string, fileIds: string[]): Promise<number> {
    if (!fileIds.length) {
      return 0;
    }

    console.log(`[文件管理] 开始删除文件, 数量: ${fileIds.length}`);
    
    try {
      // 查询要删除的文件
      const filesToDelete = await prisma.file.findMany({
        where: {
          id: { in: fileIds },
          uploaderId: userId,
          isDeleted: false,
        },
      });

      if (!filesToDelete.length) {
        return 0;
      }

      // 收集所有需要删除的ID（包括子项）
      const allIdsToDelete = new Set(fileIds);
      
      // 递归查找子项
      const findChildren = async (parentIds: string[]): Promise<string[]> => {
        if (!parentIds.length) return [];
        
        const children = await prisma.file.findMany({
          where: {
            parentId: { in: parentIds },
            uploaderId: userId,
            isDeleted: false,
          },
          select: { id: true }
        });
        
        const childIds = children.map(c => c.id);
        
        if (childIds.length) {
          // 添加到删除集合
          childIds.forEach(id => allIdsToDelete.add(id));
          
          // 递归查找更深层次的子项
          const grandChildIds = await findChildren(childIds);
          grandChildIds.forEach(id => allIdsToDelete.add(id));
        }
        
        return childIds;
      };

      // 查找所有要删除的文件夹的子项
      const folderIds = filesToDelete
        .filter(file => file.isFolder)
        .map(file => file.id);
        
      if (folderIds.length) {
        await findChildren(folderIds);
      }

      // 执行批量软删除
      const deleteResult = await prisma.file.updateMany({
        where: {
          id: { in: Array.from(allIdsToDelete) },
          uploaderId: userId,
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      // 清理收藏关系：删除所有与这些文件相关的收藏记录
      const allIdsArray = Array.from(allIdsToDelete);
      if (allIdsArray.length > 0) {
        try {
          // 删除收藏记录
          const deletedFavorites = await prisma.favorite.deleteMany({
            where: {
              fileId: { in: allIdsArray }
            }
          });
          console.log(`[文件管理] 已删除 ${deletedFavorites.count} 条相关的收藏记录`);
          
          // 触发收藏夹刷新事件（浏览器端处理）
          // 这部分逻辑由前端处理
        } catch (favoriteError) {
          console.error('[文件管理] 清理收藏记录时出错:', favoriteError);
          // 继续处理，不影响主流程
        }
      }

      // 尝试删除物理文件（仅针对非文件夹）
      const nonFolderFiles = filesToDelete.filter(file => !file.isFolder && file.filename);
      
      if (nonFolderFiles.length) {
        // 异步删除物理文件，不阻塞响应
        Promise.all(
          nonFolderFiles.map(file => {
            const filePath = join(UPLOAD_DIR, file.filename);
            
            return safeAsync(async () => {
              if (existsSync(filePath)) {
                await unlink(filePath);
                console.log(`[文件管理] 已删除物理文件: ${filePath}`);
              }
            }, { showError: false });
          })
        ).catch(err => {
          console.error('[文件管理] 删除物理文件时发生错误:', err);
        });
      }

      console.log(`[文件管理] 删除完成, 共删除: ${deleteResult.count} 个文件或文件夹`);
      return deleteResult.count;
    } catch (error) {
      console.error('[文件管理] 删除文件失败:', error);
      throw createFileError('delete', '删除文件失败');
    }
  }

  /**
   * 移动文件
   */
  async moveFiles(
    userId: string,
    fileIds: string[],
    targetFolderId: string | null
  ): Promise<number> {
    if (!fileIds.length) {
      return 0;
    }

    console.log(`[文件管理] 开始移动文件, 数量: ${fileIds.length}, 目标文件夹: ${targetFolderId || '根目录'}`);
    
    try {
      // 验证目标文件夹
      let targetFolder = null;
      let targetPath = '/';
      
      if (targetFolderId) {
        targetFolder = await prisma.file.findFirst({
          where: {
            id: targetFolderId,
            uploaderId: userId,
            isFolder: true,
            isDeleted: false,
          },
        });
        
        if (!targetFolder) {
          throw createFileError('access', '目标文件夹不存在或无权访问');
        }
        
        targetPath = targetFolder.path;
        
        // 检查是否正在将文件夹移动到自身或其子文件夹中
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
        
        // 检查要移动的文件夹是否包含目标文件夹
        const foldersToMove = await prisma.file.findMany({
          where: {
            id: { in: fileIds },
            isFolder: true,
            uploaderId: userId,
            isDeleted: false,
          },
        });
        
        for (const folder of foldersToMove) {
          if (await isMovingToSelfOrChild(folder.id)) {
            throw createFileError('access', '不能将文件夹移动到其自身或子文件夹中');
          }
        }
      }
      
      // 查询所有要移动的文件
      const filesToMove = await prisma.file.findMany({
        where: {
          id: { in: fileIds },
          uploaderId: userId,
          isDeleted: false,
        },
      });
      
      if (!filesToMove.length) {
        return 0;
      }
      
      // 检查目标文件夹中是否有同名文件
      const fileNames = filesToMove.map(file => file.name);
      const existingFiles = await prisma.file.findMany({
        where: {
          name: { in: fileNames },
          parentId: targetFolderId,
          uploaderId: userId,
          isDeleted: false,
          id: { notIn: fileIds }, // 排除要移动的文件自身
        },
      });
      
      if (existingFiles.length) {
        const existingNames = existingFiles.map(file => `"${file.name}"`).join('、');
        throw createFileError('access', `目标文件夹中已存在同名文件: ${existingNames}`);
      }
      
      // 执行移动操作
      const updateResult = await prisma.file.updateMany({
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
      
      console.log(`[文件管理] 移动完成, 共移动: ${updateResult.count} 个文件或文件夹`);
      return updateResult.count;
    } catch (error) {
      console.error('[文件管理] 移动文件失败:', error);
      if (error.type === 'file_access') {
        throw error;
      }
      throw createFileError('access', '移动文件失败');
    }
  }

  /**
   * 重命名文件
   */
  async renameFile(
    userId: string,
    fileId: string,
    newName: string,
    tags?: string[]
  ): Promise<FileInfo> {
    console.log(`[文件管理] 开始重命名文件: ${fileId} -> ${newName}`);
    
    try {
      // 查询文件
      const file = await prisma.file.findFirst({
        where: {
          id: fileId,
          uploaderId: userId,
          isDeleted: false,
        },
      });
      
      if (!file) {
        throw createFileError('access', '文件不存在或无权访问');
      }
      
      // 清理文件名
      const sanitizedName = newName.trim();
      
      if (!sanitizedName) {
        throw createFileError('access', '文件名不能为空');
      }
      
      // 检查同名文件
      const existingFile = await prisma.file.findFirst({
        where: {
          name: sanitizedName,
          parentId: file.parentId,
          uploaderId: userId,
          isDeleted: false,
          id: { not: fileId }, // 排除自身
        },
      });
      
      if (existingFile) {
        throw createFileError('access', `已存在同名${file.isFolder ? '文件夹' : '文件'}: "${sanitizedName}"`);
      }
      
      // 处理标签
      const uniqueTags = tags 
        ? [...new Set(tags.filter(tag => tag && typeof tag === 'string' && tag.trim() !== ''))]
        : undefined;
      
      // 更新文件记录
      const updatedFile = await prisma.file.update({
        where: { id: fileId },
        data: {
          name: sanitizedName,
          ...(uniqueTags && { tags: uniqueTags }),
          updatedAt: new Date(),
        },
      });
      
      console.log(`[文件管理] 重命名完成: ${file.name} -> ${updatedFile.name}`);
      return mapFileEntityToFileInfo(updatedFile);
    } catch (error) {
      console.error('[文件管理] 重命名文件失败:', error);
      if (error.type === 'file_access') {
        throw error;
      }
      throw createFileError('access', '重命名文件失败');
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
      preserveOriginalType?: boolean;
    }
  ): Promise<FileInfo> {
    console.log(`[文件管理] 开始更新文件信息: ${fileId}`, updates);
    
    try {
      // 查询文件
      const file = await prisma.file.findFirst({
        where: {
          id: fileId,
          uploaderId: userId,
          isDeleted: false,
        },
      });
      
      if (!file) {
        throw createFileError('access', '文件不存在或无权访问');
      }
      
      // 准备更新数据
      const updateData: any = { updatedAt: new Date() };
      
      // 处理名称更新
      if (updates.name !== undefined) {
        const sanitizedName = updates.name.trim();
        
        if (!sanitizedName) {
          throw createFileError('access', '文件名不能为空');
        }
        
        // 检查同名文件（如果名称有变化）
        if (sanitizedName !== file.name) {
          const existingFile = await prisma.file.findFirst({
            where: {
              name: sanitizedName,
              parentId: file.parentId,
              uploaderId: userId,
              isDeleted: false,
              id: { not: fileId }, // 排除自身
            },
          });
          
          if (existingFile) {
            throw createFileError('access', `已存在同名${file.isFolder ? '文件夹' : '文件'}: "${sanitizedName}"`);
          }
          
          updateData.name = sanitizedName;
        }
      }
      
      // 处理标签更新
      if (updates.tags !== undefined) {
        const uniqueTags = [...new Set(updates.tags.filter(tag => tag && typeof tag === 'string' && tag.trim() !== ''))];
        updateData.tags = uniqueTags;
      }
      
      // 处理文件类型保留
      if (updates.preserveOriginalType !== undefined && !file.isFolder) {
        // 这里可以添加保留原始文件类型的逻辑
        // 例如: updateData.preserveOriginalType = updates.preserveOriginalType;
      }
      
      // 如果没有要更新的数据，直接返回当前文件
      if (Object.keys(updateData).length === 1) { // 只有updatedAt
        return mapFileEntityToFileInfo(file);
      }
      
      // 更新文件记录
      const updatedFile = await prisma.file.update({
        where: { id: fileId },
        data: updateData,
      });
      
      console.log(`[文件管理] 文件信息更新完成:`, {
        id: updatedFile.id,
        name: updatedFile.name,
        tagsCount: updatedFile.tags?.length || 0,
      });
      
      return mapFileEntityToFileInfo(updatedFile);
    } catch (error) {
      console.error('[文件管理] 更新文件信息失败:', error);
      if (error.type === 'file_access') {
        throw error;
      }
      throw createFileError('access', '更新文件信息失败');
    }
  }
} 