/**
 * NextAuth 错误处理辅助函数
 * 
 * 这个文件包含处理认证过程中可能出现的网络错误的辅助函数
 */

import { isNetworkError, withRetry } from '@/app/utils/error';

// 定义自己的错误类型接口
interface NetworkError extends Error {
  code?: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

/**
 * 获取格式化的错误信息
 */
export const getFormattedAuthError = (error: any): { code: string; message: string } => {
  // 默认错误信息
  let code = 'AuthError';
  let message = '登录过程中发生错误，请稍后重试';
  
  if (!error) {
    return { code, message };
  }
  
  // 处理具体错误类型
  if (error.response && typeof error.response.status === 'number') {
    // HTTP类错误
    code = `HTTP_${error.response.status || 'ERROR'}`;
    message = error.response.data?.message || error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (error.message) {
    message = error.message;
    code = error.code || error.name || 'AuthError';
  }
  
  // 特别处理网络错误
  if (isNetworkError(error)) {
    code = 'NETWORK_ERROR';
    message = '网络连接问题，请检查您的网络连接并重试';
  }
  
  return { code, message };
}; 