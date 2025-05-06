/**
 * 文件统计和分析服务
 * 提供文件统计信息、收藏文件和最近文件等功能
 */
import { prisma } from '@/app/lib/database';
import { Prisma } from '@prisma/client';
import { FileInfo } from '@/app/types';
import { createFileError } from '@/app/utils/error';
import { mapFileEntityToFileInfo } from './file-upload-service';
import { API_PATHS } from '@/app/lib/api/paths';

/**
 * 文件统计和分析服务类
 * 负责文件统计信息、收藏和最近文件等功能
 */
export class FileStatsService {
  
  /**
   * 获取用户的存储统计信息
   */
  async getStorageStats(userId: string): Promise<{
    totalSize: number;
    usedSize: number;
    fileCount: number;
    folderCount: number;
  }> {
    try {
      // 文件总数统计
      const fileCount = await prisma.file.count({
        where: {
          uploaderId: userId,
          isFolder: false,
          isDeleted: false,
        },
      });

      // 文件夹总数统计
      const folderCount = await prisma.file.count({
        where: {
          uploaderId: userId,
          isFolder: true,
          isDeleted: false,
        },
      });

      // 已使用存储空间
      const usedSizeResult = await prisma.file.aggregate({
        where: {
          uploaderId: userId,
          isFolder: false,
          isDeleted: false,
        },
        _sum: {
          size: true,
        },
      });

      // 总存储空间配额
      const userQuota = await prisma.user.findUnique({
        where: { id: userId },
        select: { storageLimit: true },
      });

      const usedSize = usedSizeResult._sum.size || 0;
      const totalSize = userQuota?.storageLimit || 10 * 1024 * 1024 * 1024; // 默认10GB

      return {
        totalSize,
        usedSize,
        fileCount,
        folderCount,
      };
    } catch (error) {
      console.error('获取存储统计信息失败:', error);
      throw createFileError('access', '获取存储统计信息失败');
    }
  }

  /**
   * 获取最近文件
   */
  async getRecentFiles(userId: string, limit = 10): Promise<FileInfo[]> {
    try {
      // 使用请求参数构建查询
      const searchParams = `?limit=${limit}`;
      
      // 使用fetch调用API接口获取最近文件
      const response = await fetch(`${API_PATHS.STORAGE.RECENT}${searchParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // 添加缓存控制
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`获取最近文件失败: ${response.status}`);
      }
      
      const result = await response.json();
      return result.files || [];
    } catch (error) {
      console.error('获取最近文件失败:', error);
      throw createFileError('access', '获取最近文件失败');
    }
  }

  /**
   * 添加到收藏夹
   * 注意：由于模型中没有isFavorite字段，我们使用tags数组存储收藏状态
   */
  async addToFavorites(userId: string, fileIds: string[]): Promise<number> {
    if (!fileIds.length) {
      return 0;
    }

    console.log(`[文件统计] 添加文件到收藏夹, 数量: ${fileIds.length}`);

    try {
      // 确保文件存在且属于当前用户
      const files = await prisma.file.findMany({
        where: {
          id: { in: fileIds },
          uploaderId: userId,
          isDeleted: false,
        },
        select: { id: true, tags: true },
      });

      if (!files.length) {
        return 0;
      }

      // 更新每个文件的标签，添加favorite标签
      let updatedCount = 0;
      for (const file of files) {
        const tags = [...new Set([...(file.tags || []), 'favorite'])];
        
        await prisma.file.update({
          where: { id: file.id },
          data: {
            tags,
            updatedAt: new Date(),
          },
        });
        
        updatedCount++;
      }

      console.log(`[文件统计] 已添加 ${updatedCount} 个文件到收藏夹`);
      return updatedCount;
    } catch (error) {
      console.error('[文件统计] 添加收藏失败:', error);
      throw createFileError('access', '添加文件到收藏夹失败');
    }
  }

  /**
   * 从收藏夹移除
   */
  async removeFromFavorites(userId: string, fileIds: string[]): Promise<number> {
    // 强化参数验证：确保fileIds是有效的非空数组
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      console.log('[文件统计] 移除收藏失败: 无效的文件ID列表');
      return 0;
    }

    console.log(`[文件统计] 从收藏夹移除文件, 数量: ${fileIds.length}, IDs: ${fileIds.join(',')}`);

    try {
      // 确保fileIds是一个非空数组
      if (!fileIds.length) {
        return 0;
      }
      
      // 查找具有favorite标签的文件
      const files = await prisma.file.findMany({
        where: {
          id: { in: fileIds },
          uploaderId: userId,
          isDeleted: false,
          tags: { has: 'favorite' },
        },
        select: { id: true, tags: true },
      });
      
      if (!files.length) {
        console.log('[文件统计] 未找到要移除收藏的文件');
        return 0;
      }
      
      // 更新每个文件的标签，移除favorite标签
      let updatedCount = 0;
      for (const file of files) {
        const tags = (file.tags || []).filter(tag => tag !== 'favorite');
        
        await prisma.file.update({
          where: { id: file.id },
          data: {
            tags,
            updatedAt: new Date(),
          },
        });
        
        updatedCount++;
      }

      console.log(`[文件统计] 已从收藏夹移除 ${updatedCount} 个文件`);
      return updatedCount;
    } catch (error) {
      console.error('[文件统计] 移除收藏失败:', error);
      throw createFileError('access', '从收藏夹移除文件失败');
    }
  }

  /**
   * 获取收藏文件
   */
  async getFavorites(
    userId: string,
    page = 1,
    pageSize = 50
  ): Promise<{ items: FileInfo[]; total: number; page: number; pageSize: number }> {
    try {
      // 查询条件
      const where = {
        uploaderId: userId,
        tags: { has: 'favorite' },
        isDeleted: false,
      };

      // 总记录数
      const total = await prisma.file.count({ where });

      // 分页查询
      const items = await prisma.file.findMany({
        where,
        orderBy: [
          { isFolder: 'desc' },
          { updatedAt: 'desc' },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      return {
        items: items.map(mapFileEntityToFileInfo),
        total,
        page,
        pageSize,
      };
    } catch (error) {
      console.error('获取收藏文件失败:', error);
      throw createFileError('access', '获取收藏文件失败');
    }
  }

  /**
   * 记录文件访问
   * @param userId 用户ID
   * @param fileId 文件ID
   * @returns 操作是否成功
   */
  async recordFileAccess(userId: string, fileId: string): Promise<boolean> {
    try {
      console.log(`[文件统计] 记录文件访问历史: ${fileId}`);
      
      // 检查文件是否存在
      const file = await prisma.file.findFirst({
        where: {
          id: fileId,
          isDeleted: false
        }
      });
      
      if (!file) {
        console.warn(`[文件统计] 无法记录访问历史: 找不到文件 ${fileId}`);
        return false;
      }
      
      // 使用API接口记录访问
      try {
        const response = await fetch(API_PATHS.STORAGE.RECORD_ACCESS, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            fileId,
            userId 
          }),
        });
        
        if (!response.ok) {
          throw new Error(`记录访问失败: ${response.status}`);
        }
        
        const result = await response.json();
        return result.success === true;
      } catch (apiError) {
        console.error('[文件统计] 通过API记录访问历史失败:', apiError);
        // 接口调用失败，尝试直接使用Prisma记录
        await prisma.fileAccess.create({
          data: {
            userId,
            fileId,
            accessedAt: new Date()
          }
        });
        
        return true;
      }
    } catch (error) {
      console.error('[文件统计] 记录访问历史失败:', error);
      // 这个操作失败不应该影响用户体验
      return false;
    }
  }

  /**
   * 获取最近下载的文件
   * @param userId 用户ID
   * @param limit 限制数量
   * @returns 文件信息列表
   */
  async getRecentDownloads(userId: string, limit = 10): Promise<FileInfo[]> {
    try {
      // 使用API获取最近下载
      const response = await fetch(`${API_PATHS.STORAGE.DOWNLOADS.RECENT}?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`获取最近下载失败: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[文件统计] 获取最近下载文件响应:', result);
      
      // 处理不同的返回格式
      if (result && typeof result === 'object') {
        if (Array.isArray(result)) {
          return result;
        } else if (result.files && Array.isArray(result.files)) {
          return result.files;
        } else if (result.items && Array.isArray(result.items)) {
          return result.items;
        }
      }
      
      // 默认返回空数组
      return [];
    } catch (error) {
      console.error('[文件统计] 获取最近下载失败:', error);
      throw createFileError('access', '获取最近下载失败');
    }
  }
  
  /**
   * 下载文件获取Blob
   * 客户端方法，获取单个或多个文件的Blob
   * 
   * @param fileIds 要下载的文件ID列表
   * @returns 文件Blob
   */
  async downloadFiles(fileIds: string[]): Promise<Blob> {
    try {
      // 验证输入
      if (!fileIds || !fileIds.length) {
        throw createFileError('download', '需要提供要下载的文件ID');
      }
      
      // 使用API下载文件
      const response = await fetch(API_PATHS.STORAGE.FILES.DOWNLOAD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileIds }),
      });
      
      if (!response.ok) {
        throw createFileError('download', `下载请求失败: ${response.status}`);
      }
      
      // 获取blob并返回
      return await response.blob();
    } catch (error) {
      console.error('[文件统计] 下载文件失败:', error);
      throw createFileError('download', error instanceof Error ? error.message : '下载文件失败');
    }
  }
} 