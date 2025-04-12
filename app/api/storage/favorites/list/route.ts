/**
 * 收藏列表API路由
 * 获取用户收藏的文件列表
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
 * 获取收藏列表
 */
export const GET = withAuth<{ items: FileInfo[]; total: number; page: number; pageSize: number }>(
  async (req: AuthenticatedRequest) => {
    try {
      // 获取查询参数
      const { searchParams } = new URL(req.url);
      const page = searchParams.has('page') ? parseInt(searchParams.get('page')!) : 1;
      const pageSize = searchParams.has('pageSize') ? parseInt(searchParams.get('pageSize')!) : 50;
      
      // 获取收藏列表
      const result = await storageService.getFavorites(
        req.user.id,
        page,
        pageSize
      );
      
      return createApiResponse(result);
    } catch (error: any) {
      console.error('获取收藏列表失败:', error);
      return createApiErrorResponse(error.message || '获取收藏列表失败', 500);
    }
  }
); 