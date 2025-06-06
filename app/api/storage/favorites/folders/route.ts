/**
 * 收藏夹API路由
 * 获取、创建和管理用户的收藏夹
 */
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { FavoriteService } from '@/app/services/storage';
import { NextResponse } from 'next/server';

const favoriteService = new FavoriteService();

/**
 * GET方法：获取收藏夹列表
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    // 修复可能存在的多个默认收藏夹问题
    await favoriteService.fixMultipleDefaultFolders(req.user.id);
    
    // 获取用户的收藏夹列表
    const folders = await favoriteService.getFavoriteFolders(req.user.id);
    
    return createApiResponse({ folders });
  } catch (error: any) {
    console.error('获取收藏夹列表失败:', error);
    return createApiErrorResponse(error.message || '获取收藏夹列表失败', 500);
  }
});

/**
 * POST方法：创建新收藏夹
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    // 获取请求体数据
    const body = await req.json();
    const { name, description, isDefault } = body;
    
    // 验证名称
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return createApiErrorResponse('请提供有效的收藏夹名称', 400);
    }
    
    // 创建新收藏夹
    const folder = await favoriteService.createFavoriteFolder(
      req.user.id, 
      name.trim(), 
      description, 
      !!isDefault
    );
    
    return NextResponse.json({
      success: true,
      data: { folder }
    });
  } catch (error: any) {
    console.error('创建收藏夹失败:', error);
    return createApiErrorResponse(error.message || '创建收藏夹失败', 500);
  }
}); 