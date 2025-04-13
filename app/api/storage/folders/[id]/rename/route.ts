/**
 * 文件夹重命名API路由
 * 处理单个文件夹的重命名请求
 */

import { NextResponse } from 'next/server';
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { StorageService } from '@/app/services/storage-service';

const storageService = new StorageService();

// 重命名请求接口
interface RenameFileRequest {
  newName: string;
  tags?: string[];
}

/**
 * POST /api/storage/folders/[id]/rename
 * 重命名文件夹
 * 
 * @param request 请求对象
 * @returns 响应对象，包含更新后的文件夹信息
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    // 从URL路径参数中获取文件夹ID
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const idIndex = pathSegments.findIndex(segment => segment === 'folders') + 1;
    const folderId = pathSegments[idIndex];
    
    if (!folderId) {
      return createApiErrorResponse('文件夹ID不能为空', 400);
    }
    
    // 解析请求体
    const body = await req.json() as RenameFileRequest;
    const { newName, tags } = body;
    
    // 验证必要参数
    if (!newName || typeof newName !== 'string' || !newName.trim()) {
      return createApiErrorResponse('新文件夹名不能为空', 400);
    }
    
    // 调用服务层进行文件夹重命名
    const result = await storageService.renameFile(
      folderId,
      newName.trim(),
      req.user.id,
      tags
    );
    
    return createApiResponse(result);
  } catch (error: any) {
    console.error('重命名错误:', error);
    
    // 根据错误类型返回不同的状态码
    if (error.message.includes('不存在')) {
      return createApiErrorResponse(error.message, 404);
    } else if (error.message.includes('同名')) {
      return createApiErrorResponse(error.message, 409);
    } else if (error.message.includes('权限')) {
      return createApiErrorResponse(error.message, 403);
    }
    
    return createApiErrorResponse('重命名失败，请稍后重试', 500);
  }
}); 