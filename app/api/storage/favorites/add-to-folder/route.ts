/**
 * 添加到收藏夹API路由
 * 将文件添加到指定收藏夹
 */
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { StorageService } from '@/app/services/storage-service';

const storageService = new StorageService();

// 定义响应类型
interface AddToFolderResponse {
  success?: boolean;
  count?: number;
}

/**
 * POST方法：添加文件到收藏夹
 */
export const POST = withAuth<AddToFolderResponse>(async (req: AuthenticatedRequest) => {
  try {
    // 获取请求体数据
    const body = await req.json();
    const { fileId, fileIds, folderId } = body;
    
    // 处理单个文件或多个文件
    if (fileId) {
      // 单个文件
      const success = await storageService.addToFavoriteFolder(
        req.user.id, 
        fileId, 
        folderId
      );
      
      return createApiResponse({ success });
    } else if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
      // 多个文件
      const count = await storageService.addBatchToFavoriteFolder(
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