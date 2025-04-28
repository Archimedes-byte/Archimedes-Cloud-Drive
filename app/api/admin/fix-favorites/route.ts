/**
 * 管理员工具：修复默认收藏夹
 * 这个API端点用于修复所有用户的多个默认收藏夹问题
 */
import { 
  withAuth, 
  AuthenticatedRequest,
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { FavoriteService } from '@/app/services/storage';
import { NextResponse } from 'next/server';

const favoriteService = new FavoriteService();

// 允许访问此API的管理员邮箱列表
const ADMIN_EMAILS = ['admin@example.com']; // 请替换为实际的管理员邮箱

/**
 * POST方法：修复所有用户的默认收藏夹问题
 * 注意：此API仅供管理员使用
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    // 检查用户权限 - 通过邮箱判断是否为管理员
    const isAdmin = ADMIN_EMAILS.includes(req.user.email);
    
    if (!isAdmin) {
      return createApiErrorResponse('没有权限执行此操作', 403);
    }
    
    // 执行批量修复
    const result = await favoriteService.batchFixAllUsersDefaultFolders();
    
    return NextResponse.json({
      success: true,
      data: {
        message: `成功修复 ${result.fixed}/${result.total} 个用户的默认收藏夹问题`,
        ...result
      }
    });
  } catch (error: any) {
    console.error('修复默认收藏夹失败:', error);
    return createApiErrorResponse(error.message || '修复失败', 500);
  }
}); 