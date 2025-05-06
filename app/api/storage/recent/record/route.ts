/**
 * 记录文件访问历史API路由
 * 创建或更新文件访问历史记录
 */
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { prisma } from '@/app/lib/database';

/**
 * POST方法：记录文件访问历史
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    // 获取请求体数据
    const body = await req.json();
    const { fileId } = body;
    
    console.log(`[API:recent/record] 记录文件访问, 用户ID: ${req.user.id}, 文件ID: ${fileId}`);
    
    // 验证文件ID
    if (!fileId) {
      console.warn('[API:recent/record] 文件ID不能为空');
      return createApiErrorResponse('文件ID不能为空', 400);
    }
    
    // 查找文件并验证文件存在
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        isDeleted: false,
      },
    });
    
    if (!file) {
      console.warn(`[API:recent/record] 文件不存在或已被删除: ${fileId}`);
      return createApiErrorResponse('文件不存在或已被删除', 404);
    }
    
    try {
      // 创建新的文件访问记录
      await prisma.fileAccess.create({
        data: {
          userId: req.user.id,
          fileId: fileId,
          accessedAt: new Date()
        }
      });
      
      console.log(`[API:recent/record] 成功记录文件访问: ${fileId}`);
      return createApiResponse({ success: true });
    } catch (dbError) {
      console.error('[API:recent/record] 数据库操作失败:', dbError);
      throw dbError;
    }
  } catch (error: any) {
    console.error('[API:recent/record] 记录文件访问历史失败:', error);
    return createApiErrorResponse(error.message || '记录文件访问失败', 500);
  }
}); 