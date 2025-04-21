/**
 * 收藏列表API路由
 * 处理收藏列表的POST和DELETE请求
 */
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { StorageService } from '@/app/services/storage-service';
import { FileInfo } from '@/app/types';
import { NextResponse } from 'next/server';

const storageService = new StorageService();

/**
 * POST方法：获取收藏列表
 * 与GET /api/storage/favorites/list 功能相同，但支持POST请求
 */
export const POST = withAuth<{ items: FileInfo[]; total: number; page: number; pageSize: number }>(
  async (req: AuthenticatedRequest) => {
    try {
      // 获取请求体中的分页参数（如果有）
      const body = await req.json().catch(() => ({}));
      const page = body.page || 1;
      const pageSize = body.pageSize || 50;
      
      // 获取收藏列表
      const result = await storageService.getFavorites(
        req.user.id,
        page,
        pageSize
      );
      
      // 修改返回格式，让客户端能正确处理
      return NextResponse.json({
        success: true,
        data: {
          items: result.items,
          total: result.total,
          page: result.page,
          pageSize: result.pageSize
        }
      });
    } catch (error: any) {
      console.error('获取收藏列表失败:', error);
      return createApiErrorResponse(error.message || '获取收藏列表失败', 500);
    }
  }
);

/**
 * DELETE方法：删除收藏
 */
export const DELETE = withAuth<{ deletedCount: number }>(
  async (req: AuthenticatedRequest) => {
    try {
      // 获取请求体中的fileIds
      const body = await req.json();
      const fileIds = body.fileIds || body.favoriteIds || [];
      
      if (!Array.isArray(fileIds) || fileIds.length === 0) {
        return createApiErrorResponse('请提供有效的文件ID列表', 400);
      }
      
      console.log('DELETE 收藏API: 接收到移除收藏请求', { 
        fileIdsCount: fileIds.length,
        fileIds: fileIds
      });
      
      // 删除收藏
      const count = await storageService.removeFromFavorites(req.user.id, fileIds);
      
      // 使用与其他API一致的返回格式
      return NextResponse.json({
        success: true,
        data: { deletedCount: count }
      });
    } catch (error: any) {
      console.error('删除收藏失败:', error);
      return createApiErrorResponse(error.message || '删除收藏失败', 500);
    }
  }
); 