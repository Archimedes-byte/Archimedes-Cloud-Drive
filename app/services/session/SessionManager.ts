import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { handleUnauthorized } from '@/app/utils/api/error-handler';

// 定义扩展的Session用户类型
interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isAdmin?: boolean;
}

// 定义会话类型
interface AppSession {
  user?: ExtendedUser;
  expires: string;
}

/**
 * 会话管理服务
 * 
 * 提供API路由中处理会话的统一方法
 */
export class SessionManager {
  private readonly authOptions: any;
  
  /**
   * 创建会话管理器实例
   * 
   * @param authOptions 认证选项
   */
  constructor(authOptions: any) {
    this.authOptions = authOptions;
  }
  
  /**
   * 获取当前会话
   * 
   * @returns 会话对象，如果未认证则返回null
   */
  async getSession(): Promise<AppSession | null> {
    try {
      return await getServerSession(this.authOptions) as AppSession;
    } catch (error) {
      console.error('获取会话失败:', error);
      return null;
    }
  }
  
  /**
   * 验证会话并执行处理函数
   * 
   * @param handler 处理函数，接收会话和请求作为参数
   * @param request 请求对象，可选
   * @returns 处理函数的返回值，或未授权错误响应
   */
  async withSession<T>(
    handler: (session: AppSession, request?: NextRequest) => Promise<T>, 
    request?: NextRequest
  ) {
    const session = await this.getSession();
    
    if (!session?.user?.email) {
      return handleUnauthorized();
    }
    
    return handler(session, request);
  }
  
  /**
   * 验证会话并验证用户是否为管理员
   * 
   * @param handler 处理函数，接收会话和请求作为参数
   * @param request 请求对象，可选
   * @returns 处理函数的返回值，或未授权错误响应
   */
  async withAdmin<T>(
    handler: (session: AppSession, request?: NextRequest) => Promise<T>, 
    request?: NextRequest
  ) {
    const session = await this.getSession();
    
    if (!session?.user?.email) {
      return handleUnauthorized('未授权访问');
    }
    
    if (!session.user.isAdmin) {
      return handleUnauthorized('需要管理员权限');
    }
    
    return handler(session, request);
  }
  
  /**
   * 创建处理器包装函数，简化路由处理
   * 
   * @param handler 处理函数
   * @param requireSession 是否需要会话
   * @returns 包装后的处理函数
   */
  createHandler<T>(
    handler: (session: AppSession | null, request?: NextRequest) => Promise<T | NextResponse>,
    requireSession: boolean = true
  ) {
    return async (request?: NextRequest) => {
      if (requireSession) {
        return this.withSession(handler, request);
      } else {
        const session = await this.getSession();
        return handler(session, request);
      }
    };
  }
} 