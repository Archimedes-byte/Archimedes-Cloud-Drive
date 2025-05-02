/**
 * 文件批量删除API路由
 * 处理批量删除文件请求
 * 
 * 注意：系统中的文件删除API设计:
 * 1. DELETE /api/storage/files/[id] - 针对单个文件的高效删除，使用直接数据库操作
 * 2. POST /api/storage/files/delete (当前API) - 针对批量删除场景优化，可处理多个文件
 * 
 * 两个API使用不同的实现方式:
 * - DELETE是轻量级实现，直接在数据库中标记单个文件为已删除
 * - POST方法包含完整的批量逻辑，可以一次处理多个文件，有更多验证
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
 * POST /api/storage/files/delete
 * 
 * 请求体参数:
 * - fileIds: string[] - 要删除的文件ID数组
 * 
 * 响应:
 * - { deletedCount: number } - 成功删除的文件数量
 */
export const POST = withAuth<{ deletedCount: number }>(async (req: AuthenticatedRequest) => {
  try {
    // 获取请求体数据
    const { fileIds } = await req.json();
    
    // 验证文件ID数组
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return createApiErrorResponse('文件ID列表无效', 400);
    }
    
    console.log(`处理批量删除请求: ${fileIds.length}个文件`);
    
    // 执行批量删除
    const deletedCount = await managementService.deleteFiles(req.user.id, fileIds);
    
    console.log(`批量删除完成: 删除了${deletedCount}个文件`);
    
    return createApiResponse({ deletedCount });
  } catch (error: any) {
    console.error('批量删除文件失败:', error);
    return createApiErrorResponse(error.message || '批量删除文件失败', 500);
  }
}); 