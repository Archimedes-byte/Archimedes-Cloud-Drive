/**
 * 存储信息API路由
 * 获取用户存储的综合信息，包括统计数据和配额
 */
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { StorageService } from '@/app/services/storage-service';
import { prisma } from '@/app/lib/database';
import { FileInfo } from '@/app/types';

const storageService = new StorageService();

/**
 * 获取存储信息
 */
export const GET = withAuth<{
  stats: {
    totalFiles: number;
    totalFolders: number;
    totalSize: number;
  };
  quota: {
    total: number;
    used: number;
    available: number;
    percentage: number;
  };
  recent: FileInfo[];
}>(async (req: AuthenticatedRequest) => {
  try {
    // 获取统计信息
    const stats = await storageService.getStorageStats(req.user.id);
    
    // 获取用户配额信息
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { storageLimit: true, storageUsed: true }
    });
    
    // 计算配额数据
    const totalQuota = user?.storageLimit || 10 * 1024 * 1024 * 1024;
    const usedSpace = stats.usedSize; // 使用统计的使用量，更准确
    const availableSpace = Math.max(0, totalQuota - usedSpace);
    const usagePercentage = totalQuota > 0 ? Math.min(100, (usedSpace / totalQuota) * 100) : 100;
    
    // 如果数据库中的使用量与统计不一致，更新用户记录
    if (user && user.storageUsed !== usedSpace) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { storageUsed: usedSpace }
      });
    }
    
    // 获取最近文件
    const recentFiles = await storageService.getRecentFiles(req.user.id, 5);
    
    return createApiResponse({
      stats: {
        totalFiles: stats.fileCount,
        totalFolders: stats.folderCount,
        totalSize: stats.usedSize
      },
      quota: {
        total: totalQuota,
        used: usedSpace,
        available: availableSpace,
        percentage: parseFloat(usagePercentage.toFixed(2))
      },
      recent: recentFiles
    });
  } catch (error: any) {
    console.error('获取存储信息失败:', error);
    return createApiErrorResponse(error.message || '获取存储信息失败', 500);
  }
}); 