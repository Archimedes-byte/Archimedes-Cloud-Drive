/**
 * 存储统计API路由
 * 获取用户的存储使用情况
 */
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { FileStatsService } from '@/app/services/storage';

const statsService = new FileStatsService();

/**
 * 获取存储统计信息
 */
export const GET = withAuth<{
  totalSize: number;
  usedSize: number;
  fileCount: number;
  folderCount: number;
}>(async (req: AuthenticatedRequest) => {
  try {
    // 获取存储统计信息
    const stats = await statsService.getStorageStats(req.user.id);
    
    return createApiResponse(stats);
  } catch (error: any) {
    console.error('获取存储统计失败:', error);
    return createApiErrorResponse(error.message || '获取存储统计失败', 500);
  }
}); 