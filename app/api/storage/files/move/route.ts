/**
 * 文件移动API路由
 * 处理文件移动操作
 */
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { FileManagementService } from '@/app/services/storage';

const managementService = new FileManagementService();

/**
 * 移动文件到目标文件夹
 */
export const POST = withAuth<{ movedCount: number }>(async (req: AuthenticatedRequest) => {
  try {
    // 获取请求体数据
    const { fileIds, targetFolderId } = await req.json();
    
    // 验证文件ID数组
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return createApiErrorResponse('文件ID列表无效', 400);
    }
    
    // 验证目标文件夹ID
    if (targetFolderId === undefined) {
      return createApiErrorResponse('目标文件夹ID无效', 400);
    }
    
    // 执行文件移动
    const movedCount = await managementService.moveFiles(req.user.id, fileIds, targetFolderId);
    
    return createApiResponse({ movedCount });
  } catch (error: any) {
    console.error('移动文件失败:', error);
    return createApiErrorResponse(error.message || '移动文件失败', 500);
  }
}); 