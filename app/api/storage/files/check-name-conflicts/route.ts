/**
 * 文件名冲突检查API路由
 * 用于检查指定文件夹下是否存在同名文件或文件夹
 */
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { db } from '@/app/lib/database';
import { NextResponse } from 'next/server';

interface CheckNameConflictsRequest {
  folderId: string;
  fileNames: string[];
}

/**
 * 检查文件名冲突
 * POST /api/storage/files/check-name-conflicts
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    // 获取请求体
    const { folderId, fileNames } = await req.json() as CheckNameConflictsRequest;
    
    if (!fileNames || !Array.isArray(fileNames) || fileNames.length === 0) {
      return createApiErrorResponse('文件名列表不能为空', 400);
    }
    
    // 处理根文件夹的特殊情况
    const parentId = folderId === 'root' ? null : folderId;
    
    // 查询当前文件夹下的所有文件和文件夹
    const existingFiles = await db.file.findMany({
      where: {
        parentId: parentId,
        uploaderId: req.user.id,
        isDeleted: false,
        name: {
          in: fileNames
        }
      },
      select: {
        name: true,
        isFolder: true
      }
    });
    
    // 提取冲突的文件名
    const conflicts = existingFiles.map(file => file.name);
    
    // 返回冲突列表
    return createApiResponse({ conflicts });
  } catch (error) {
    console.error('检查文件名冲突时出错:', error);
    return createApiErrorResponse('检查文件名冲突失败', 500);
  }
}); 