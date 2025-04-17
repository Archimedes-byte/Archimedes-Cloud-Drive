/**
 * 错误处理工具集中导出
 * 
 * 整合了错误处理相关的功能，包括：
 * - 错误类型定义
 * - 错误处理函数
 * - 错误格式化工具
 * - 重试机制
 */

import { message } from 'antd';

/**
 * 错误类型枚举
 */
export enum ErrorType {
  // 网络错误
  NETWORK = 'network',
  // API错误
  API = 'api',
  // 验证错误
  VALIDATION = 'validation',
  // 权限错误
  PERMISSION = 'permission',
  // 资源未找到
  NOT_FOUND = 'not_found',
  // 请求超时
  TIMEOUT = 'timeout',
  // 文件错误
  FILE_UPLOAD = 'file_upload',
  FILE_DOWNLOAD = 'file_download',
  FILE_DELETE = 'file_delete',
  FILE_ACCESS = 'file_access',
  // 未知错误
  UNKNOWN = 'unknown'
}

/**
 * 错误信息接口
 */
export interface ErrorInfo {
  // 错误类型
  type: ErrorType;
  // 错误消息
  message: string;
  // 错误详情
  details?: any;
  // 错误时间戳
  timestamp: string;
  // 错误代码（可选）
  code?: string | number;
  // HTTP状态码（可选）
  statusCode?: number;
}

/**
 * 应用错误基类
 */
export class AppError extends Error {
  type: ErrorType;
  details?: any;
  timestamp: string;
  code?: string | number;
  statusCode?: number;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    details?: any,
    code?: string | number,
    statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.code = code;
    this.statusCode = statusCode;
  }

  // 转换为错误信息对象
  toErrorInfo(): ErrorInfo {
    return {
      type: this.type,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      code: this.code,
      statusCode: this.statusCode
    };
  }
}

/**
 * 网络错误
 */
export class NetworkError extends AppError {
  constructor(message = '网络连接失败，请检查网络设置', details?: any) {
    super(message, ErrorType.NETWORK, details);
    this.name = 'NetworkError';
  }
}

/**
 * API错误
 */
export class ApiError extends AppError {
  constructor(message = 'API请求失败', statusCode?: number, code?: string | number, details?: any) {
    super(message, ErrorType.API, details, code, statusCode);
    this.name = 'ApiError';
  }
}

/**
 * 验证错误
 */
export class ValidationError extends AppError {
  constructor(message = '数据验证失败', details?: any) {
    super(message, ErrorType.VALIDATION, details);
    this.name = 'ValidationError';
  }
}

/**
 * 权限错误
 */
export class PermissionError extends AppError {
  constructor(message = '权限不足，无法执行操作', details?: any) {
    super(message, ErrorType.PERMISSION, details);
    this.name = 'PermissionError';
  }
}

/**
 * 找不到资源错误
 */
export class NotFoundError extends AppError {
  constructor(message = '请求的资源不存在', details?: any) {
    super(message, ErrorType.NOT_FOUND, details);
    this.name = 'NotFoundError';
  }
}

/**
 * 超时错误
 */
export class TimeoutError extends AppError {
  constructor(message = '请求超时，请稍后重试', details?: any) {
    super(message, ErrorType.TIMEOUT, details);
    this.name = 'TimeoutError';
  }
}

/**
 * 文件错误
 */
export class FileError extends AppError {
  constructor(message: string, type: ErrorType, details?: any) {
    super(message, type, details);
    this.name = 'FileError';
  }
}

/**
 * 创建特定类型的文件错误
 */
export function createFileError(
  type: 'upload' | 'download' | 'delete' | 'access',
  message: string,
  details?: any
): FileError {
  const errorTypes = {
    upload: ErrorType.FILE_UPLOAD,
    download: ErrorType.FILE_DOWNLOAD,
    delete: ErrorType.FILE_DELETE,
    access: ErrorType.FILE_ACCESS
  };
  
  return new FileError(message, errorTypes[type], details);
}

/**
 * 类型保护函数
 */
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

/**
 * 格式化任意错误为标准AppError
 */
export function formatError(error: any): AppError {
  // 已经是AppError，直接返回
  if (error instanceof AppError) {
    return error;
  }
  
  // 网络错误
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new NetworkError(error.message);
  }
  
  // API响应错误
  if (error && typeof error === 'object') {
    // 检查标准API错误格式
    if (error.error || error.message) {
      const errorMessage = error.error || error.message || '请求失败';
      const statusCode = error.status || error.statusCode;
      const errorCode = error.code;
      return new ApiError(errorMessage, statusCode, errorCode, error);
    }
  }
  
  // 普通Error对象
  if (error instanceof Error) {
    return new AppError(error.message, ErrorType.UNKNOWN, { originalError: error });
  }
  
  // 字符串错误消息
  if (typeof error === 'string') {
    return new AppError(error);
  }
  
  // 未知错误
  return new AppError('发生未知错误', ErrorType.UNKNOWN, { originalError: error });
}

/**
 * 处理错误并显示消息
 */
export function handleError(
  error: any,
  showMessage = true,
  logLevel: 'error' | 'warn' | 'info' = 'error'
): AppError {
  // 标准化错误对象
  const appError = formatError(error);
  
  // 显示错误消息
  if (showMessage) {
    message.error(appError.message);
  }
  
  // 记录错误日志
  if (logLevel === 'error') {
    console.error('应用错误:', appError);
  } else if (logLevel === 'warn') {
    console.warn('应用警告:', appError);
  } else {
    console.info('应用信息:', appError);
  }
  
  return appError;
}

/**
 * 带有重试功能的错误处理
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    delay?: number;
    onRetry?: (error: any, attempt: number) => void;
    shouldRetry?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    retries = 3,
    delay = 1000,
    onRetry,
    shouldRetry = () => true
  } = options;
  
  let lastError: any;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // 最后一次重试失败
      if (attempt === retries) {
        throw formatError(error);
      }
      
      // 检查是否应该重试
      if (!shouldRetry(error)) {
        throw formatError(error);
      }
      
      // 调用重试回调
      if (onRetry) {
        onRetry(error, attempt + 1);
      }
      
      // 等待后重试，增加延迟时间
      const waitTime = delay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  // 不应该到达这里，但为了类型安全
  throw formatError(lastError || new Error('操作失败'));
}

/**
 * 处理异步操作的包装器，提供统一的错误处理
 */
export async function safeAsync<T>(
  asyncFn: () => Promise<T>,
  errorOptions: {
    showError?: boolean;
    errorMessage?: string;
    fallbackValue?: T;
    rethrow?: boolean;
  } = {}
): Promise<T | null> {
  const {
    showError = true,
    errorMessage,
    fallbackValue = null as unknown as T,
    rethrow = false
  } = errorOptions;
  
  try {
    return await asyncFn();
  } catch (error) {
    const appError = formatError(error);
    
    // 自定义错误消息
    if (errorMessage) {
      appError.message = errorMessage;
    }
    
    // 处理错误
    handleError(appError, showError);
    
    // 是否重新抛出错误
    if (rethrow) {
      throw appError;
    }
    
    // 返回后备值
    return fallbackValue;
  }
}
