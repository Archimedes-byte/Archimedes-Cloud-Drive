/**
 * 收藏列表API路由
 * 处理收藏列表的POST请求
 * 
 * 注意：
 * - 获取收藏列表建议使用 GET /api/storage/favorites/list 接口
 * - 添加收藏请使用 POST /api/storage/favorites/add-to-folder 接口
 * - 删除收藏请使用 POST /api/storage/favorites/remove-from-folder 接口
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
 * POST方法：获取收藏列表
 * 与GET /api/storage/favorites/list 功能相同，但支持POST请求
 */
export const POST = withAuth<{ items: FileInfo[]; total: number; page: number; pageSize: number }>(
  async (req: AuthenticatedRequest) => {
    try {
      const { page = 1, pageSize = 50 } = await req.json();
      
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