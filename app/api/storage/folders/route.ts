/**
 * 文件夹API路由
 * 处理文件夹相关请求
 */
import { NextRequest } from 'next/server';
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse,
  ApiResponse
} from '@/app/middleware/auth';
import { StorageService } from '@/app/services/storage-service';
import { FileInfo } from '@/app/types';

const storageService = new StorageService();

/**
 * 创建文件夹
 */
export const POST = withAuth<FileInfo>(async (req: AuthenticatedRequest) => {
  try {
    // 获取请求体数据
    const { name, parentId, tags = [] } = await req.json();

    if (!name?.trim()) {
      return createApiErrorResponse('文件夹名称不能为空', 400);
    }

    // 创建文件夹
    const folder = await storageService.createFolder(req.user.id, name, parentId, tags);
    
    // 确保返回正确的响应格式
    return createApiResponse(folder);
  } catch (error: any) {
    console.error('创建文件夹失败:', error);
    return createApiErrorResponse(error.message || '创建文件夹失败', 500);
  }
});

/**
 * 获取文件夹列表
 */
export const GET = withAuth<{ items: FileInfo[]; total: number; page: number; pageSize: number }>(
  async (req: AuthenticatedRequest) => {
    try {
      // 获取查询参数
      const { searchParams } = new URL(req.url);
      const parentId = searchParams.get('parentId');
      const page = searchParams.has('page') ? parseInt(searchParams.get('page')!) : 1;
      const pageSize = searchParams.has('pageSize') ? parseInt(searchParams.get('pageSize')!) : 50;
      
      // 设置文件夹查询的特殊条件
      const result = await storageService.getFiles(
        req.user.id,
        parentId,
        'folder', // 只获取文件夹
        page,
        pageSize,
        'name', // 按名称排序
        'asc'    // 升序
      );
      
      return createApiResponse(result);
    } catch (error: any) {
      console.error('获取文件夹列表失败:', error);
      return createApiErrorResponse(error.message || '获取文件夹列表失败', 500);
    }
  }
); 