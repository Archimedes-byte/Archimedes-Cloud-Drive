/**
 * 收藏列表API路由
 * 获取用户收藏的文件列表
 * 
 * 请求参数(GET参数):
 * - page: 页码，默认为1
 * - pageSize: 每页数量，默认为50
 * 
 * 响应: 
 * {
 *   items: FileInfo[],     // 收藏文件列表
 *   total: number,         // 总数量
 *   page: number,          // 当前页码
 *   pageSize: number       // 每页数量
 * }
 * 
 * 注意: 此API提供GET请求，对应的POST请求见 /api/storage/favorites
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
 * 主收藏列表API：此API是获取收藏列表的标准GET接口
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