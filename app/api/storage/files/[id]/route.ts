/**
 * 单个文件API路由
 * 处理单个文件的获取、更新和删除请求
 */
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { FileManagementService } from '@/app/services/storage';
import { FileInfo } from '@/app/types';
import { prisma } from '@/app/lib/database';

const managementService = new FileManagementService();

/**
 * 获取单个文件信息
 */
export const GET = withAuth<FileInfo>(async (req: AuthenticatedRequest) => {
  try {
    // 从路径中获取文件ID
    const fileId = req.url.split('/').pop();
    
    if (!fileId) {
      return createApiErrorResponse('文件ID无效', 400);
    }
    
    // 获取文件信息
    const file = await managementService.getFile(req.user.id, fileId);
    
    return createApiResponse(file);
  } catch (error: any) {
    console.error('获取文件信息失败:', error);
    return createApiErrorResponse(error.message || '获取文件信息失败', 500);
  }
});

/**
 * 更新文件信息
 */
export const PATCH = withAuth<FileInfo>(async (req: AuthenticatedRequest) => {
  try {
    // 从路径中获取文件ID
    const fileId = req.url.split('/').pop();
    
    if (!fileId) {
      return createApiErrorResponse('文件ID无效', 400);
    }
    
    // 获取请求体数据
    const { name, tags, preserveOriginalType } = await req.json();
    
    // 验证至少有一个要更新的字段
    if (!name && !tags && preserveOriginalType === undefined) {
      return createApiErrorResponse('至少提供一个更新字段', 400);
    }
    
    // 更新文件信息
    const updatedFile = await managementService.updateFile(req.user.id, fileId, { 
      name, 
      tags,
      preserveOriginalType
    });
    
    return createApiResponse(updatedFile);
  } catch (error: any) {
    console.error('更新文件信息失败:', error);
    return createApiErrorResponse(error.message || '更新文件信息失败', 500);
  }
});

/**
 * 删除单个文件 
 * 优化实现: 直接标记单个文件为已删除，而不经过批量删除逻辑
 */
export const DELETE = withAuth<{ success: boolean }>(async (req: AuthenticatedRequest) => {
  try {
    // 从路径中获取文件ID
    const fileId = req.url.split('/').pop();
    
    if (!fileId) {
      return createApiErrorResponse('文件ID无效', 400);
    }
    
    // 直接标记文件为已删除 - 优化的单文件删除逻辑
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        uploaderId: req.user.id,
        isDeleted: false
      }
    });
    
    if (!file) {
      return createApiErrorResponse('文件不存在或无权访问', 404);
    }
    
    // 更新文件为已删除状态
    await prisma.file.update({
      where: { id: fileId },
      data: { 
        isDeleted: true,
        updatedAt: new Date()
      }
    });
    
    return createApiResponse({ success: true });
  } catch (error: any) {
    console.error('删除文件失败:', error);
    return createApiErrorResponse(error.message || '删除文件失败', 500);
  }
}); 