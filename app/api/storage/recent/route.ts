/**
 * 最近文件API路由
 * 获取用户最近访问的文件
 */
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { FileStatsService } from '@/app/services/storage';
import { FileInfo } from '@/app/types';

const statsService = new FileStatsService();

// 定义API响应类型
interface RecentFilesResponse {
  files: FileInfo[];
}

/**
 * 获取最近文件
 */
export const GET = withAuth<RecentFilesResponse>(async (req: AuthenticatedRequest) => {
  try {
    // 获取查询参数
    const { searchParams } = new URL(req.url);
    const limit = searchParams.has('limit') ? parseInt(searchParams.get('limit')!) : 10;
    
    // 限制最大获取数量
    const safeLimit = Math.min(limit, 50);
    
    console.log(`[API:recent] 获取最近访问文件, 用户ID: ${req.user.id}, 限制: ${safeLimit}`);
    
    // 获取最近文件
    const recentFiles = await statsService.getRecentFiles(req.user.id, safeLimit);
    
    console.log(`[API:recent] 找到 ${recentFiles.length} 个最近访问文件`);
    
    // 修改：使用files字段包装数据，与前端期望的格式保持一致
    return createApiResponse({ files: recentFiles });
  } catch (error: any) {
    console.error('[API:recent] 获取最近文件失败:', error);
    return createApiErrorResponse(error.message || '获取最近文件失败', 500);
  }
}); 