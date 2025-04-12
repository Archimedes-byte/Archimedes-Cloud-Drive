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
import { StorageService } from '@/app/services/storage-service';
import { FileInfo } from '@/app/types';

const storageService = new StorageService();

/**
 * 获取最近文件
 */
export const GET = withAuth<FileInfo[]>(async (req: AuthenticatedRequest) => {
  try {
    // 获取查询参数
    const { searchParams } = new URL(req.url);
    const limit = searchParams.has('limit') ? parseInt(searchParams.get('limit')!) : 10;
    
    // 限制最大获取数量
    const safeLimit = Math.min(limit, 50);
    
    // 获取最近文件
    const recentFiles = await storageService.getRecentFiles(req.user.id, safeLimit);
    
    return createApiResponse(recentFiles);
  } catch (error: any) {
    console.error('获取最近文件失败:', error);
    return createApiErrorResponse(error.message || '获取最近文件失败', 500);
  }
}); 