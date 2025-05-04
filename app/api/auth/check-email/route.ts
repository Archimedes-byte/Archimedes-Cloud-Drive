/**
 * 检查邮箱是否已经注册
 */
import { NextRequest } from 'next/server';
import { 
  createSuccessResponse, 
  createErrorResponse,
  logAuthError
} from '@/app/lib/error/auth-error';
import { checkEmailExists } from '@/app/lib/auth/auth-service';
import { RateLimiter } from '@/app/lib/security/rate-limiter';

// 创建速率限制器实例，每分钟最多5次请求
const rateLimiter = new RateLimiter('check-email', 5, 60 * 1000);

/**
 * 检查邮箱是否已经存在
 */
export async function GET(request: NextRequest) {
  try {
    // 获取客户端IP
    const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    
    // 进行速率限制检查
    if (!rateLimiter.check(ip)) {
      return createErrorResponse('操作过于频繁，请稍后再试', 429);
    }
    
    // 从请求URL参数中获取邮箱
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return createErrorResponse('请提供有效的邮箱地址', 400);
    }
    
    // 使用统一的邮箱检查服务
    const exists = await checkEmailExists(email);

    // 返回结果
    return createSuccessResponse(
      { exists },
      `邮箱检查完成`
    );
  } catch (error) {
    logAuthError(error, 'check-email-api');
    
    return createErrorResponse(
      '邮箱检查失败',
      500
    );
  }
} 