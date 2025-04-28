/**
 * 收藏夹详情API路由
 * 获取、更新和删除特定收藏夹
 */
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { FavoriteService } from '@/app/services/storage';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const favoriteService = new FavoriteService();

/**
 * PATCH方法：更新收藏夹信息
 */
export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    // 从URL中获取文件夹ID
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const folderId = pathParts[pathParts.length - 1];
    
    if (!folderId) {
      return createApiErrorResponse('收藏夹ID无效', 400);
    }
    
    // 获取请求体数据
    const body = await req.json();
    const { name, description, isDefault } = body;
    
    // 构造更新数据
    const updateData: any = {};
    if (name !== undefined && name !== null) {
      updateData.name = name;
    }
    if (description !== undefined) {
      updateData.description = description;
    }
    if (isDefault !== undefined) {
      updateData.isDefault = !!isDefault;
    }
    
    // 如果没有任何更新数据，返回错误
    if (Object.keys(updateData).length === 0) {
      return createApiErrorResponse('请提供要更新的收藏夹信息', 400);
    }
    
    // 更新收藏夹
    const folder = await favoriteService.updateFavoriteFolder(
      req.user.id, 
      folderId, 
      updateData
    );
    
    return createApiResponse({ folder });
  } catch (error: any) {
    console.error('更新收藏夹失败:', error);
    return createApiErrorResponse(error.message || '更新收藏夹失败', 500);
  }
});

/**
 * DELETE方法：删除收藏夹
 */
export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  try {
    // 从URL中获取文件夹ID
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const folderId = pathParts[pathParts.length - 1];
    
    if (!folderId) {
      return createApiErrorResponse('收藏夹ID无效', 400);
    }
    
    // 删除收藏夹
    const success = await favoriteService.deleteFavoriteFolder(
      req.user.id, 
      folderId
    );
    
    return createApiResponse({ success, message: success ? '收藏夹已删除' : '删除收藏夹失败' });
  } catch (error: any) {
    console.error('删除收藏夹失败:', error);
    return createApiErrorResponse(error.message || '删除收藏夹失败', 500);
  }
}); 