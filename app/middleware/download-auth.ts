/**
 * 文件下载身份验证中间件
 * 专门处理文件下载路由的身份验证逻辑
 */
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { type Session } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/database';

/**
 * 扩展的请求对象，包含用户信息
 */
export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  session?: Session;
}

/**
 * 简单的API错误响应
 */
function createErrorResponse(error: string, status: number): Response {
  return new Response(
    JSON.stringify({ success: false, error }),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * 文件下载身份验证中间件
 * 验证用户身份并将用户信息附加到请求对象
 * 允许处理函数返回二进制响应
 */
export function withDownloadAuth(
  handler: (req: AuthenticatedRequest) => Promise<Response>
): (req: NextRequest) => Promise<Response> {
  return async (req: NextRequest) => {
    try {
      // 获取用户会话
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.email) {
        return createErrorResponse('未授权', 401);
      }
      
      // 获取用户信息
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
      
      if (!user) {
        return createErrorResponse('用户不存在', 404);
      }
      
      // 将用户信息附加到请求对象
      const authReq = req as AuthenticatedRequest;
      authReq.user = {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
      };
      
      // 调用处理函数并确保捕获处理函数中的错误
      try {
        return await handler(authReq);
      } catch (handlerError) {
        console.error('文件下载处理函数错误:', handlerError);
        return createErrorResponse('文件下载处理失败', 500);
      }
    } catch (error) {
      console.error('下载身份验证错误:', error);
      return createErrorResponse('身份验证失败', 500);
    }
  };
} 