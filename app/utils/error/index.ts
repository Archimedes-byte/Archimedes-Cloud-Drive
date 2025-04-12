/**
 * 错误处理工具集中导出
 * 
 * 整合了错误处理相关的功能，包括：
 * - 错误类型定义
 * - 错误处理函数
 * - 错误格式化工具
 */

// 导出错误类型定义
export * from './types';

// 导出错误处理函数
export * from './handlers';

// 导出错误格式化工具
export * from './formatters';

/**
 * 错误处理工具函数
 * 提供统一的错误处理机制
 */

import { message } from 'antd';

/**
 * 错误类型枚举
 */
export enum ErrorType {
  NETWORK = 'network',
  API = 'api',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  NOT_FOUND = 'not_found',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown',
}

/**
 * 自定义错误类
 */
export class AppError extends Error {
  type: ErrorType;
  code?: string;
  details?: Record<string, any>;

  constructor(message: string, type: ErrorType = ErrorType.UNKNOWN, code?: string, details?: Record<string, any>) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.code = code;
    this.details = details;
  }
}

/**
 * 网络错误
 */
export class NetworkError extends AppError {
  constructor(message = '网络连接错误，请检查网络后重试', code?: string, details?: Record<string, any>) {
    super(message, ErrorType.NETWORK, code, details);
    this.name = 'NetworkError';
  }
}

/**
 * API错误
 */
export class ApiError extends AppError {
  constructor(message = 'API请求失败', code?: string, details?: Record<string, any>) {
    super(message, ErrorType.API, code, details);
    this.name = 'ApiError';
  }
}

/**
 * 验证错误
 */
export class ValidationError extends AppError {
  constructor(message = '数据验证失败', code?: string, details?: Record<string, any>) {
    super(message, ErrorType.VALIDATION, code, details);
    this.name = 'ValidationError';
  }
}

/**
 * 权限错误
 */
export class PermissionError extends AppError {
  constructor(message = '没有操作权限', code?: string, details?: Record<string, any>) {
    super(message, ErrorType.PERMISSION, code, details);
    this.name = 'PermissionError';
  }
}

/**
 * 找不到资源错误
 */
export class NotFoundError extends AppError {
  constructor(message = '找不到请求的资源', code?: string, details?: Record<string, any>) {
    super(message, ErrorType.NOT_FOUND, code, details);
    this.name = 'NotFoundError';
  }
}

/**
 * 超时错误
 */
export class TimeoutError extends AppError {
  constructor(message = '请求超时，请稍后重试', code?: string, details?: Record<string, any>) {
    super(message, ErrorType.TIMEOUT, code, details);
    this.name = 'TimeoutError';
  }
}

/**
 * 处理错误并显示消息
 * @param error 错误对象
 * @param showMessage 是否显示消息提示
 * @returns 格式化后的错误对象
 */
export function handleError(error: any, showMessage = true): AppError {
  // 标准化错误对象
  const appError = formatError(error);
  
  // 显示错误消息
  if (showMessage) {
    message.error(appError.message);
  }
  
  // 记录错误日志
  console.error('应用错误:', appError);
  
  return appError;
}

/**
 * 将任意错误对象转换为AppError
 * @param error 错误对象
 * @returns 标准化的错误对象
 */
export function formatError(error: any): AppError {
  // 已经是AppError，直接返回
  if (error instanceof AppError) {
    return error;
  }
  
  // 网络错误
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new NetworkError();
  }
  
  // 普通Error对象
  if (error instanceof Error) {
    return new AppError(error.message);
  }
  
  // 字符串错误消息
  if (typeof error === 'string') {
    return new AppError(error);
  }
  
  // API错误响应
  if (error && typeof error === 'object' && error.error) {
    return new ApiError(error.error);
  }
  
  // 未知错误
  return new AppError('发生未知错误');
}

/**
 * 带有重试功能的错误处理
 * @param fn 要执行的异步函数
 * @param retries 重试次数
 * @param delay 重试延迟(毫秒)
 * @returns 函数执行结果或抛出错误
 */
export async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // 最后一次重试失败
      if (i === retries) {
        throw formatError(error);
      }
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  
  // 不应该到达这里，但为了类型安全
  throw formatError(lastError || new Error('操作失败'));
}
