/**
 * 标签API路由
 * 处理标签相关请求
 */
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { prisma } from '@/app/lib/database';

/**
 * 获取标签列表
 */
export const GET = withAuth<string[]>(async (req: AuthenticatedRequest) => {
  try {
    // 获取用户所有文件中使用的标签
    const files = await prisma.file.findMany({
      where: {
        uploaderId: req.user.id,
        isDeleted: false,
        tags: { isEmpty: false }
      },
      select: {
        tags: true
      }
    });
    
    // 提取所有标签并去重
    const allTags = files.flatMap(file => file.tags as string[]);
    const uniqueTags = [...new Set(allTags)].sort();
    
    return createApiResponse(uniqueTags);
  } catch (error: any) {
    console.error('获取标签列表失败:', error);
    return createApiErrorResponse(error.message || '获取标签列表失败', 500);
  }
});

/**
 * 创建新标签
 * 注意: 这不是创建独立的标签记录，而是为指定文件添加标签
 */
export const POST = withAuth<{ success: boolean; tag: string }>(async (req: AuthenticatedRequest) => {
  try {
    const { tag, fileIds } = await req.json();
    
    // 验证请求参数
    if (!tag || typeof tag !== 'string' || tag.trim() === '') {
      return createApiErrorResponse('标签名称无效', 400);
    }
    
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return createApiErrorResponse('文件ID列表无效', 400);
    }
    
    // 清理标签名
    const cleanTag = tag.trim();
    
    // 更新指定文件，添加新标签
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
          // 当前标签列表
          const currentTags = file.tags as string[] || [];
          
          // 如果标签不存在，则添加
          if (!currentTags.includes(cleanTag)) {
            await prisma.file.update({
              where: { id: fileId },
              data: {
                tags: [...currentTags, cleanTag],
                updatedAt: new Date()
              }
            });
          }
        }
      }
    });
    
    return createApiResponse({ success: true, tag: cleanTag });
  } catch (error: any) {
    console.error('创建标签失败:', error);
    return createApiErrorResponse(error.message || '创建标签失败', 500);
  }
}); 