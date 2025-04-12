/**
 * 存储配额API路由
 * 获取用户的存储配额信息
 */
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { StorageService } from '@/app/services/storage-service';
import { prisma } from '@/app/lib/database';

const storageService = new StorageService();

/**
 * 获取存储配额信息
 */
export const GET = withAuth<{
  total: number;
  used: number;
  available: number;
  percentage: number;
}>(async (req: AuthenticatedRequest) => {
  try {
    // 获取用户信息，包括配额
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { storageLimit: true, storageUsed: true }
    });

    // 默认配额为10GB (如果未设置)
    const totalQuota = user?.storageLimit || 10 * 1024 * 1024 * 1024;
    
    // 获取已使用存储空间 - 优先使用数据库中的值，如果不可用则使用统计计算值
    let usedSpace = user?.storageUsed || 0;
    
    // 如果数据库中的使用量为0，可能是未更新过，尝试通过文件统计计算
    if (usedSpace === 0) {
      const stats = await storageService.getStorageStats(req.user.id);
      usedSpace = stats.usedSize;
      
      // 更新用户的存储使用量
      await prisma.user.update({
        where: { id: req.user.id },
        data: { storageUsed: usedSpace }
      });
    }
    
    // 计算可用空间和使用百分比
    const availableSpace = Math.max(0, totalQuota - usedSpace);
    const usagePercentage = totalQuota > 0 ? Math.min(100, (usedSpace / totalQuota) * 100) : 100;
    
    return createApiResponse({
      total: totalQuota,
      used: usedSpace,
      available: availableSpace,
      percentage: parseFloat(usagePercentage.toFixed(2))
    });
  } catch (error: any) {
    console.error('获取存储配额失败:', error);
    return createApiErrorResponse(error.message || '获取存储配额失败', 500);
  }
}); 