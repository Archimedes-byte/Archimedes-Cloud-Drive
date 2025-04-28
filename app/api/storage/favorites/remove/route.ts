/**
 * 移除收藏API路由
 * 从收藏夹中移除文件
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
 * 从收藏中移除文件
 */
export const POST = withAuth<{ count: number }>(async (req: AuthenticatedRequest) => {
  try {
    // 获取请求体数据
    const { fileIds } = await req.json();
    
    // 验证文件ID数组
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      console.warn('移除收藏API: 接收到无效的fileIds参数', { fileIds });
      return createApiErrorResponse('文件ID列表无效', 400);
    }
    
    console.log('移除收藏API: 接收到请求', { 
      userId: req.user.id, 
      fileIdsCount: fileIds.length,
      fileIds: fileIds
    });
    
    // 移除收藏 - 使用新版移除API（不指定收藏夹ID表示从所有收藏夹中移除）
    const count = await favoriteService.removeBatchFromFolder(req.user.id, fileIds);
    
    return createApiResponse({ count });
  } catch (error: any) {
    console.error('移除收藏失败:', error);
    return createApiErrorResponse(error.message || '移除收藏失败', 500);
  }
}); 