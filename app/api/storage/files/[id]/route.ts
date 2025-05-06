/**
 * 单个文件API路由
 * 处理单个文件的获取、更新和删除请求
 */
import { NextResponse } from 'next/server';
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { join } from 'path';
import { existsSync } from 'fs';
import { promises as fs } from 'fs';
import { FileInfo } from '@/app/types';
import { prisma } from '@/app/lib/database';
import mime from 'mime-types';

// 上传目录
const UPLOAD_DIR = join(process.cwd(), 'uploads');

/**
 * 将数据库文件实体转换为前端FileInfo对象
 */
function mapToFileInfo(file: any): FileInfo {
  return {
    id: file.id,
    name: file.name,
    type: file.type || 'unknown',
    size: file.size || 0,
    isFolder: file.isFolder,
    createdAt: file.createdAt.toISOString(),
    updatedAt: file.updatedAt.toISOString(),
    path: file.path,
    parentId: file.parentId,
    tags: file.tags || [],
    url: file.url || undefined,
  };
}

/**
 * 获取文件的存储路径
 */
async function getFilePath(fileInfo: FileInfo): Promise<string | null> {
  if (!fileInfo) return null;
  
  let filePath: string | null = null;
  let fileExists = false;
  
  // 1. 尝试使用filename字段
  if (fileInfo.filename) {
    filePath = join(UPLOAD_DIR, fileInfo.filename);
    fileExists = existsSync(filePath);
    if (fileExists) {
      return filePath;
    }
  }
  
  // 2. 尝试从URL解析
  if (!fileExists && fileInfo.url) {
    const urlParts = fileInfo.url.split('/');
    const filenameFromUrl = urlParts[urlParts.length - 1];
    if (filenameFromUrl) {
      filePath = join(UPLOAD_DIR, filenameFromUrl);
      fileExists = existsSync(filePath);
      if (fileExists) {
        return filePath;
      }
    }
  }
  
  // 3. 使用ID作为文件名
  filePath = join(UPLOAD_DIR, fileInfo.id);
  fileExists = existsSync(filePath);
  if (fileExists) {
    return filePath;
  }
  
  return null;
}

/**
 * 获取单个文件信息
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    // 获取文件ID
    const segments = req.url.split('/');
    const fileId = segments[segments.length - 1];
    
    if (!fileId) {
      return createApiErrorResponse('文件ID无效', 400);
    }
    
    // 使用prisma直接查询文件
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        isDeleted: false
      }
    });
    
    if (!file) {
      return createApiErrorResponse('文件不存在或已被删除', 404);
    }
    
    // 权限检查
    if (file.uploaderId !== req.user.id) {
      // 检查文件是否被共享
      const hasAccess = await prisma.fileShareFile.findFirst({
        where: {
          fileId,
          share: {
            userId: req.user.id
          }
        }
      });
      
      if (!hasAccess) {
        return createApiErrorResponse('无权访问此文件', 403);
      }
    }
    
    // 转换为FileInfo格式并返回
    const fileInfo = mapToFileInfo(file);
    
    // 记录访问历史（异步，不阻塞响应）
    try {
      await prisma.fileAccess.create({
        data: {
          userId: req.user.id,
          fileId: fileId,
          accessedAt: new Date()
        }
      });
    } catch (accessError) {
      console.error('记录文件访问历史失败:', accessError);
      // 继续处理，不影响主流程
    }
    
    return createApiResponse(fileInfo);
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
    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: { 
        name, 
        tags,
        preserveOriginalType
      }
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