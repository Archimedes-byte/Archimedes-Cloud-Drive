/**
 * 文件统计和分析服务
 * 提供文件统计信息、收藏文件和最近文件等功能
 */
import { prisma } from '@/app/lib/database';
import { Prisma } from '@prisma/client';
import { FileInfo } from '@/app/types';
import { createFileError } from '@/app/utils/error';
import { mapFileEntityToFileInfo } from './file-upload-service';

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
      const recentFiles = await prisma.file.findMany({
        where: {
          uploaderId: userId,
          isDeleted: false,
          isFolder: false, // 只包含文件，不包含文件夹
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: limit,
      });

      return recentFiles.map(mapFileEntityToFileInfo);
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
} 