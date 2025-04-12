/**
 * NextAuth 错误处理辅助函数
 * 
 * 这个文件包含处理认证过程中可能出现的网络错误的辅助函数
 */

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
 * 检测是否为网络连接错误
 */
export const isNetworkError = (error: any): boolean => {
  if (!error) return false;
  
  // 检查常见的网络错误类型
  const errorMessage = error.message?.toLowerCase() || '';
  const networkErrorPatterns = [
    'econnreset',
    'etimedout',
    'network error',
    'socket hang up',
    'connection refused',
    'timeout',
    '连接重置',
    '连接超时',
    '网络错误'
  ];
  
  return networkErrorPatterns.some(pattern => errorMessage.includes(pattern));
};

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

/**
 * 尝试重新连接的辅助函数
 */
export const retryWithDelay = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0 || !isNetworkError(error)) {
      throw error;
    }
    
    console.log(`认证请求失败，${retries}秒后重试...`, error);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithDelay(fn, retries - 1, delay);
  }
}; 