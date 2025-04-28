/**
 * 收藏夹文件列表API路由
 * 获取指定收藏夹中的文件列表
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
 * POST方法：获取收藏夹中的文件列表
 */
export const POST = withAuth<{ items: FileInfo[]; total: number; page: number; pageSize: number }>(
  async (req: AuthenticatedRequest) => {
    try {
      // 获取请求体数据
      const body = await req.json();
      const { folderId, page = 1, pageSize = 50 } = body;
      
      // 验证收藏夹ID
      if (!folderId) {
        return createApiErrorResponse('请提供有效的收藏夹ID', 400);
      }
      
      // 获取收藏夹中的文件列表
      const result = await favoriteService.getFolderFiles(
        req.user.id,
        folderId,
        page,
        pageSize
      );
      
      return createApiResponse(result);
    } catch (error: any) {
      console.error('获取收藏夹文件列表失败:', error);
      return createApiErrorResponse(error.message || '获取收藏夹文件列表失败', 500);
    }
  }
); 