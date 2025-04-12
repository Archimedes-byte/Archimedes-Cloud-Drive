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
import { StorageService } from '@/app/services/storage-service';

const storageService = new StorageService();

/**
 * 添加文件到收藏
 */
export const POST = withAuth<{ count: number }>(async (req: AuthenticatedRequest) => {
  try {
    // 获取请求体数据
    const { fileIds } = await req.json();
    
    // 验证文件ID数组
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return createApiErrorResponse('文件ID列表无效', 400);
    }
    
    // 添加到收藏
    const count = await storageService.addToFavorites(req.user.id, fileIds);
    
    return createApiResponse({ count });
  } catch (error: any) {
    console.error('添加收藏失败:', error);
    return createApiErrorResponse(error.message || '添加收藏失败', 500);
  }
}); 