/**
 * 文件批量删除API路由
 * 处理批量删除文件请求
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
 * 批量删除文件
 */
export const POST = withAuth<{ deletedCount: number }>(async (req: AuthenticatedRequest) => {
  try {
    // 获取请求体数据
    const { fileIds } = await req.json();
    
    // 验证文件ID数组
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return createApiErrorResponse('文件ID列表无效', 400);
    }
    
    // 执行批量删除
    const deletedCount = await managementService.deleteFiles(req.user.id, fileIds);
    
    return createApiResponse({ deletedCount });
  } catch (error: any) {
    console.error('批量删除文件失败:', error);
    return createApiErrorResponse(error.message || '批量删除文件失败', 500);
  }
}); 