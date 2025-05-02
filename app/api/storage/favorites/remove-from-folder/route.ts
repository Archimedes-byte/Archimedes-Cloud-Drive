/**
 * 从收藏夹移除API路由
 * 将文件从指定收藏夹中移除
 * 
 * 请求参数:
 * - fileId: 单个文件ID (与fileIds二选一)
 * - fileIds: 多个文件ID数组 (与fileId二选一)
 * - folderId: 收藏夹ID (可选，不提供时会从所有收藏夹中移除)
 * 
 * 响应:
 * - 单个文件: { success: boolean }
 * - 多个文件: { count: number } (成功移除的文件数量)
 */
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { FavoriteService } from '@/app/services/storage';

const favoriteService = new FavoriteService();

// 定义响应类型
interface RemoveFromFolderResponse {
  success?: boolean;
  count?: number;
}

/**
 * POST方法：从收藏夹中移除文件
 * 主收藏删除API：此API是移除收藏的标准接口，替代了原来的DELETE方法
 */
export const POST = withAuth<RemoveFromFolderResponse>(async (req: AuthenticatedRequest) => {
  try {
    // 获取请求体数据
    const body = await req.json();
    const { fileId, fileIds, folderId } = body;
    
    // 处理单个文件或多个文件
    if (fileId) {
      // 单个文件
      const success = await favoriteService.removeFromFolder(
        req.user.id, 
        fileId, 
        folderId
      );
      
      return createApiResponse({ success });
    } else if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
      // 多个文件
      const count = await favoriteService.removeBatchFromFolder(
        req.user.id, 
        fileIds, 
        folderId
      );
      
      return createApiResponse({ count });
    } else {
      return createApiErrorResponse('请提供有效的文件ID', 400);
    }
  } catch (error: any) {
    console.error('从收藏夹移除失败:', error);
    return createApiErrorResponse(error.message || '从收藏夹移除失败', 500);
  }
}); 