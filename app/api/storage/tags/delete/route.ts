/**
 * 标签删除API路由
 * 处理从文件中移除标签或完全删除标签的请求
 */
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { prisma } from '@/app/lib/database';

/**
 * 删除标签
 */
export const POST = withAuth<{ deletedCount: number }>(async (req: AuthenticatedRequest) => {
  try {
    const { tag, fileIds, deleteAll = false } = await req.json();
    
    // 验证标签参数
    if (!tag || typeof tag !== 'string' || tag.trim() === '') {
      return createApiErrorResponse('标签名称无效', 400);
    }
    
    const cleanTag = tag.trim();
    
    // 如果指定了删除所有文件的标签
    if (deleteAll) {
      // 获取所有包含此标签的文件
      const files = await prisma.file.findMany({
        where: {
          uploaderId: req.user.id,
          isDeleted: false,
          tags: { has: cleanTag }
        },
        select: {
          id: true,
          tags: true
        }
      });
      
      // 从所有文件中移除此标签
      let updatedCount = 0;
      
      await prisma.$transaction(async (prisma) => {
        for (const file of files) {
          const currentTags = file.tags as string[];
          const newTags = currentTags.filter(t => t !== cleanTag);
          
          if (currentTags.length !== newTags.length) {
            await prisma.file.update({
              where: { id: file.id },
              data: {
                tags: newTags,
                updatedAt: new Date()
              }
            });
            updatedCount++;
          }
        }
      });
      
      return createApiResponse({ deletedCount: updatedCount });
    }
    
    // 否则只从指定的文件中移除标签
    else {
      // 验证文件ID列表
      if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
        return createApiErrorResponse('文件ID列表无效', 400);
      }
      
      // 从指定文件中移除标签
      let updatedCount = 0;
      
      await prisma.$transaction(async (prisma) => {
        for (const fileId of fileIds) {
          const file = await prisma.file.findFirst({
            where: {
              id: fileId,
              uploaderId: req.user.id,
              isDeleted: false
            },
            select: {
              id: true,
              tags: true
            }
          });
          
          if (file) {
            const currentTags = file.tags as string[];
            const newTags = currentTags.filter(t => t !== cleanTag);
            
            if (currentTags.length !== newTags.length) {
              await prisma.file.update({
                where: { id: file.id },
                data: {
                  tags: newTags,
                  updatedAt: new Date()
                }
              });
              updatedCount++;
            }
          }
        }
      });
      
      return createApiResponse({ deletedCount: updatedCount });
    }
  } catch (error: any) {
    console.error('删除标签失败:', error);
    return createApiErrorResponse(error.message || '删除标签失败', 500);
  }
}); 