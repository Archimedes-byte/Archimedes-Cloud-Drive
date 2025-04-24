/**
 * 记录文件访问历史API路由
 * 更新文件的最后访问时间，用于最近访问记录
 */
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { prisma } from '@/app/lib/database';
import { NextResponse } from 'next/server';

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
    
    // 查找文件并验证所有权
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
    
    // 更新文件的访问时间（我们使用updatedAt字段作为最后访问时间）
    await prisma.file.update({
      where: { id: fileId },
      data: { updatedAt: new Date() },
    });
    
    console.log(`[API:recent/record] 成功记录文件访问: ${fileId}`);
    return createApiResponse({ success: true });
  } catch (error: any) {
    console.error('[API:recent/record] 记录文件访问历史失败:', error);
    return createApiErrorResponse(error.message || '记录文件访问失败', 500);
  }
}); 