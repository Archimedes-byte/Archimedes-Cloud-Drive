import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { prisma } from '@/app/lib/database';
import { FolderPathItem } from '@/app/types';

/**
 * 获取文件夹路径
 * 返回从根文件夹到当前文件夹的路径
 * GET /api/storage/folders/[id]/path
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    // 从URL路径中提取ID参数
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    // 假设路径为/api/storage/folders/{id}/path，id是倒数第二个段
    const id = pathSegments[pathSegments.length - 2];
    
    if (!id) {
      return createApiErrorResponse('文件夹ID不能为空', 400);
    }
    
    // 获取文件夹信息
    const folder = await prisma.file.findUnique({
      where: {
        id: id,
        uploaderId: req.user.id,
        isFolder: true,
        isDeleted: false
      }
    });
    
    if (!folder) {
      return createApiErrorResponse('文件夹不存在或无权访问', 404);
    }
    
    // 构建文件夹路径
    const path: FolderPathItem[] = [];
    let currentFolderId: string | null = id;
    
    // 循环查询父文件夹，直到根文件夹
    while (currentFolderId) {
      // 添加类型注释，避免隐式any
      const currentFolder: { id: string; name: string; parentId: string | null } | null = await prisma.file.findUnique({
        where: {
          id: currentFolderId,
          uploaderId: req.user.id,
          isFolder: true,
          isDeleted: false
        },
        select: {
          id: true,
          name: true,
          parentId: true
        }
      });
      
      if (!currentFolder) break;
      
      // 添加到路径的开头
      path.unshift({
        id: currentFolder.id,
        name: currentFolder.name
      });
      
      // 移动到父文件夹
      currentFolderId = currentFolder.parentId || null;
      if (!currentFolderId) break;
    }
    
    return createApiResponse({ path });
  } catch (error: any) {
    console.error('获取文件夹路径失败:', error);
    return createApiErrorResponse(error.message || '获取文件夹路径失败', 500);
  }
}); 