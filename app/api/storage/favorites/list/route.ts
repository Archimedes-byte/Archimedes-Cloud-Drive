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
import { FavoriteService } from '@/app/services/storage';
import { FileInfo } from '@/app/types';

const favoriteService = new FavoriteService();

/**
 * 获取收藏列表
 */
export const GET = withAuth<{ items: FileInfo[]; total: number; page: number; pageSize: number }>(
  async (req: AuthenticatedRequest) => {
    try {
      // 解析分页参数
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const pageSize = parseInt(url.searchParams.get('pageSize') || '50', 10);
      
      // 获取收藏列表
      const result = await favoriteService.getAllFavoriteFiles(
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