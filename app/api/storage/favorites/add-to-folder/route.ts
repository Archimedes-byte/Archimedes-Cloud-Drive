/**
 * 添加到收藏夹API路由
 * 将文件添加到指定收藏夹
 * 
 * 请求参数:
 * - fileId: 单个文件ID (与fileIds二选一)
 * - fileIds: 多个文件ID数组 (与fileId二选一)
 * - folderId: 收藏夹ID (可选，不提供时会添加到默认收藏夹)
 * 
 * 响应:
 * - 单个文件: { success: boolean }
 * - 多个文件: { count: number } (成功添加的文件数量)
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
interface AddToFolderResponse {
  success?: boolean;
  count?: number;
}

/**
 * POST方法：添加文件到收藏夹
 * 主收藏API：此API是添加收藏的标准接口
 */
export const POST = withAuth<AddToFolderResponse>(async (req: AuthenticatedRequest) => {
  try {
    // 获取请求体数据
    const body = await req.json();
    const { fileId, fileIds, folderId } = body;
    
    // 处理单个文件或多个文件
    if (fileId) {
      // 单个文件
      const success = await favoriteService.addToFolder(
        req.user.id, 
        fileId, 
        folderId
      );
      
      return createApiResponse({ success });
    } else if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
      // 多个文件
      const count = await favoriteService.addBatchToFolder(
        req.user.id, 
        fileIds, 
        folderId
      );
      
      return createApiResponse({ count });
    } else {
      return createApiErrorResponse('请提供有效的文件ID', 400);
    }
  } catch (error: any) {
    console.error('添加到收藏夹失败:', error);
    return createApiErrorResponse(error.message || '添加到收藏夹失败', 500);
  }
}); 