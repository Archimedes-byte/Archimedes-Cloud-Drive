'use client';

/**
 * 客户端认证服务
 * 
 * 提供客户端应用所需的认证相关API调用和状态管理
 * 与 @/app/lib/auth 下服务区分：
 * - auth-service.ts: 面向客户端的高级服务接口
 * - lib/auth/*: 面向服务端的底层认证实现
 */

import { signIn, signOut } from 'next-auth/react';
import {
  ApiResponse,
  LoginCredentials,
  RegisterData
} from '@/app/types';
import { adaptApiResponse, adaptErrorToResponse } from '@/app/lib/api/response-adapter';
import { AUTH_CONSTANTS } from '@/app/constants/auth';
import { logAuthError } from '@/app/lib/error/auth-error';

/**
 * 客户端认证服务类
 */
class AuthService {
  /**
   * 执行API请求并统一处理响应
   * 
   * @param fetchPromise fetch请求Promise或一个返回响应的异步函数
   * @param errorContext 错误日志上下文
   */
  private async executeRequest<T>(
    fetchPromise: Promise<Response> | (() => Promise<Response>),
    errorContext = 'auth-service'
  ): Promise<ApiResponse<T>> {
    try {
      // 如果是函数则执行它
      const response = await (typeof fetchPromise === 'function' ? fetchPromise() : fetchPromise);
      const data = await response.json();
      return adaptApiResponse<T>(response, data);
    } catch (error) {
      logAuthError(error, errorContext);
      return adaptErrorToResponse(error);
    }
  }

  /**
   * 使用NextAuth执行登录
   * 
   * @param credentials 登录凭据
   * @param options 登录选项
   */
  async login(
    credentials: LoginCredentials, 
    options?: { redirect?: boolean; callbackUrl?: string; onSuccess?: () => void; onError?: (error: string) => void; }
  ): Promise<ApiResponse> {
    try {
      const { email, password } = credentials;
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: options?.redirect ?? false,
        callbackUrl: options?.callbackUrl ?? AUTH_CONSTANTS.ROUTES.DEFAULT_SUCCESS
      });
      
      if (result?.error) {
        const errorResponse = {
          success: false,
          error: result.error,
          statusCode: 401
        };
        
        if (options?.onError) {
          options.onError(result.error);
        }
        
        return errorResponse;
      }
      
      const successResponse = {
        success: true,
        statusCode: 200
      };
      
      if (options?.onSuccess) {
        options.onSuccess();
      }
      
      return successResponse;
    } catch (error) {
      logAuthError(error, 'login-service');
      const errorResponse = adaptErrorToResponse(error);
      
      if (options?.onError) {
        options.onError(errorResponse.error || '登录过程中发生错误');
      }
      
      return errorResponse;
    }
  }
  
  /**
   * 用户注册API调用
   */
  async register(data: { 
    email: string; 
    password: string; 
    name?: string;
  }, options?: {
    onSuccess?: () => void;
    onError?: (error: string) => void;
  }): Promise<ApiResponse<{ userId: string }>> {
    try {
      const result = await this.executeRequest<{ userId: string }>(
        () => fetch(AUTH_CONSTANTS.ENDPOINTS.REGISTER, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }),
        'register-service'
      );
      
      if (result.success && options?.onSuccess) {
        options.onSuccess();
      } else if (!result.success && options?.onError) {
        options.onError(result.error || '注册失败');
      }
      
      return result;
    } catch (error) {
      logAuthError(error, 'register-service');
      const errorResponse = adaptErrorToResponse(error) as ApiResponse<{ userId: string }>;
      
      if (options?.onError) {
        options.onError(errorResponse.error || '注册过程中发生错误');
      }
      
      return errorResponse;
    }
  }
  
  /**
   * 获取当前会话用户信息
   */
  async getCurrentUser(): Promise<ApiResponse> {
    return this.executeRequest(
      fetch('/api/auth/session', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }),
      'get-current-user'
    );
  }
  
  /**
   * 检查邮箱是否已注册
   */
  async checkEmailExists(email: string): Promise<ApiResponse<{ exists: boolean }>> {
    return this.executeRequest<{ exists: boolean }>(
      fetch(`${AUTH_CONSTANTS.ENDPOINTS.CHECK_EMAIL}?email=${encodeURIComponent(email)}`),
      'check-email-service'
    );
  }
  
  /**
   * 执行登出操作
   */
  async logout(options?: { redirect?: boolean; callbackUrl?: string }): Promise<void> {
    await signOut({
      redirect: options?.redirect ?? true,
      callbackUrl: options?.callbackUrl ?? AUTH_CONSTANTS.ROUTES.LOGIN
    });
  }

  /**
   * 一站式注册并登录
   * 简化客户端使用流程
   */
  async registerAndLogin(data: RegisterData, options: {
    withName?: boolean;
    redirect?: boolean;
    callbackUrl?: string;
    onSuccess?: () => void;
    onError?: (error: string) => void;
  } = {}): Promise<ApiResponse<any>> {
    try {
      // 第一步：注册用户
      const registerResult = await this.register({
        email: data.email,
        password: data.password,
        name: options.withName ? data.name : undefined,
      });

      // 如果注册失败，直接返回错误
      if (!registerResult.success) {
        if (options.onError) {
          options.onError(registerResult.error || '注册失败');
        }
        return registerResult;
      }

      // 第二步：自动登录 - 这里我们直接返回注册成功的结果，
      // 实际的登录将由UI层处理，避免额外的认证调用
      // 这样可以保持更好的用户体验
      if (options.onSuccess) {
        options.onSuccess();
      }
      
      return registerResult;
    } catch (error) {
      logAuthError(error, 'register-and-login-service');
      const errorResponse = adaptErrorToResponse(error);
      
      if (options.onError) {
        options.onError(errorResponse.error || '注册过程中发生错误');
      }
      
      return errorResponse;
    }
  }
}

// 导出单例实例
const authService = new AuthService();
export default authService; 