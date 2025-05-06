/**
 * API身份验证中间件
 * 处理所有API路由的身份验证逻辑
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { type Session } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/database';
import { ApiResponse as SharedApiResponse } from '@/app/types/shared/api-types';

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

// API响应类型定义，使用统一的API类型
export type ApiSuccessResponse<T> = Omit<SharedApiResponse<T>, 'data'> & {
  success: true;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  error: string;
  code?: string;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * 处理API响应的通用格式
 */
export function createApiResponse<T>(data: T, success = true, message?: string) {
  return NextResponse.json({
    success,
    data,
    message,
  } as ApiSuccessResponse<T>);
}

/**
 * 创建API错误响应
 */
export function createApiErrorResponse(error: string, status = 400, code?: string) {
  return NextResponse.json(
    {
      success: false,
      error,
      code,
    } as ApiErrorResponse,
    { status }
  );
}

/**
 * 身份验证中间件
 * 验证用户身份并将用户信息附加到请求对象
 */
export function withAuth<T>(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse<ApiResponse<T>>>
): (req: NextRequest) => Promise<NextResponse<ApiResponse<T> | ApiErrorResponse>> {
  return async (req: NextRequest) => {
    try {
      // 获取用户会话
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.email) {
        return createApiErrorResponse('未授权', 401);
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
        return createApiErrorResponse('用户不存在', 404);
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
        console.error('API处理函数错误:', handlerError);
        return createApiErrorResponse('API处理失败', 500);
      }
    } catch (error) {
      console.error('身份验证错误:', error);
      return createApiErrorResponse('身份验证失败', 500);
    }
  };
} 