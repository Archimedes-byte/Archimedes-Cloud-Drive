/**
 * 添加收藏API路由
 * 将文件添加到收藏夹
 */
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { FavoriteService } from '@/app/services/storage';

const favoriteService = new FavoriteService();

/**
 * 添加文件到收藏
 */
export const POST = withAuth<{ count: number }>(async (req: AuthenticatedRequest) => {
  try {
    // 获取请求体数据
    const { fileIds, folderId } = await req.json();
    
    // 验证文件ID数组
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return createApiErrorResponse('文件ID列表无效', 400);
    }
    
    // 添加到收藏 - 使用新版API，可以指定收藏夹
    const count = await favoriteService.addBatchToFolder(req.user.id, fileIds, folderId);
    
    return createApiResponse({ count });
  } catch (error: any) {
    console.error('添加收藏失败:', error);
    return createApiErrorResponse(error.message || '添加收藏失败', 500);
  }
}); 