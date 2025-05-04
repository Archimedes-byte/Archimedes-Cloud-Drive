import { NextRequest } from 'next/server';
import { registerSchema } from '@/app/lib/validation/schemas';
import { 
  createErrorResponse, 
  createSuccessResponse,
  logAuthError,
  getFriendlyErrorMessage
} from '@/app/lib/error/auth-error';
import { registerUser } from '@/app/lib/auth/auth-service';
import { RateLimiter } from '@/app/lib/security/rate-limiter';

// 创建速率限制器实例，每小时最多10次请求
const rateLimiter = new RateLimiter('register', 10, 60 * 60 * 1000);

/**
 * 用户注册API
 */
export async function POST(request: NextRequest) {
  try {
    // 获取客户端IP
    const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    
    // 进行速率限制检查
    if (!rateLimiter.check(ip)) {
      return createErrorResponse('操作过于频繁，请稍后再试', 429);
    }
    
    // 解析请求体
    const body = await request.json();
    
    // 验证输入数据
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      // 格式化验证错误
      const errors = validation.error.errors.map(err => `${err.path}: ${err.message}`).join(', ');
      return createErrorResponse(`表单验证失败: ${errors}`, 400);
    }
    
    const { name, email, password } = validation.data;
    
    // 使用统一的注册服务
    const newUser = await registerUser({ 
      email, 
      password, 
      name 
    });
    
    // 返回创建成功响应
    return createSuccessResponse(
      {
        userId: newUser.id
      },
      '注册成功',
      201
    );
    
  } catch (error) {
    logAuthError(error, 'register-api');
    
    // 获取友好的错误消息
    const errorMessage = getFriendlyErrorMessage(error);
    const statusCode = (error as any)?.status || 400;
    
    return createErrorResponse(errorMessage, statusCode);
  }
}