/**
 * 文件API路由
 * 处理文件相关请求
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

const storageService = new StorageService();

/**
 * 获取文件列表
 */
export const GET = withAuth<{ items: any[]; total: number; page: number; pageSize: number }>(
  async (req: AuthenticatedRequest) => {
    try {
      // 获取查询参数
      const { searchParams } = new URL(req.url);
      const folderId = searchParams.get('folderId');
      const type = searchParams.get('type');
      const page = searchParams.has('page') ? parseInt(searchParams.get('page')!) : 1;
      const pageSize = searchParams.has('pageSize') ? parseInt(searchParams.get('pageSize')!) : 50;
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';

      // 获取文件列表
      const result = await storageService.getFiles(
        req.user.id,
        folderId,
        type,
        page,
        pageSize,
        sortBy,
        sortOrder
      );

      return createApiResponse(result);
    } catch (error: any) {
      console.error('获取文件列表失败:', error);
      return createApiErrorResponse(error.message || '获取文件列表失败', 500);
    }
  }
);

/**
 * 文件上传处理
 */
export const POST = withAuth<any>(async (req: AuthenticatedRequest) => {
  try {
    const formData = await req.formData();
    const files = formData.getAll('file');
    const tagsJson = formData.get('tags');
    const folderId = formData.get('folderId')?.toString() || null;
    
    // 处理标签
    let tags: string[] = [];
    if (tagsJson && typeof tagsJson === 'string') {
      try {
        tags = JSON.parse(tagsJson);
      } catch (e) {
        console.error('解析标签JSON失败:', e);
      }
    }
    
    // 验证文件
    if (!files || files.length === 0) {
      return createApiErrorResponse('未提供文件', 400);
    }
    
    // 处理单个文件上传
    if (files.length === 1) {
      const file = files[0] as File;
      const result = await storageService.uploadFile(req.user.id, file, folderId, tags);
      return createApiResponse(result);
    }
    
    // 处理批量上传
    const results = [];
    for (const fileData of files) {
      const file = fileData as File;
      try {
        const result = await storageService.uploadFile(req.user.id, file, folderId, tags);
        results.push(result);
      } catch (error: any) {
        console.error(`上传文件 ${file.name} 失败:`, error);
        // 继续处理其他文件
      }
    }
    
    return createApiResponse(results);
  } catch (error: any) {
    console.error('文件上传失败:', error);
    return createApiErrorResponse(error.message || '文件上传失败', 500);
  }
}); 