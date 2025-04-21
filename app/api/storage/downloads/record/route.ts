/**
 * 记录文件下载历史API路由
 * 更新文件的最后下载时间，用于下载记录
 */
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import prisma from '@/app/lib/prisma';

/**
 * POST方法：记录文件下载历史
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    // 获取请求体数据
    const body = await req.json();
    const { fileId } = body;
    
    // 验证文件ID
    if (!fileId) {
      return createApiErrorResponse('文件ID不能为空', 400);
    }
    
    // 查找文件并验证所有权
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        isDeleted: false,
      },
    });
    
    if (!file) {
      return createApiErrorResponse('文件不存在或已被删除', 404);
    }
    
    // 创建或更新下载记录
    await prisma.downloadHistory.upsert({
      where: {
        userId_fileId: {
          userId: req.user.id,
          fileId: fileId
        }
      },
      update: {
        downloadedAt: new Date()
      },
      create: {
        userId: req.user.id,
        fileId: fileId,
        downloadedAt: new Date()
      }
    });
    
    return createApiResponse({ success: true });
  } catch (error: any) {
    console.error('记录文件下载历史失败:', error);
    return createApiErrorResponse(error.message || '记录文件下载失败', 500);
  }
}); 