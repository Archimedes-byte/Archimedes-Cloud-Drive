/**
 * 统一错误处理模块
 * 
 * 提供全局统一的错误处理机制，包括：
 * - 错误类型定义
 * - 错误标准化
 * - 错误展示
 * - 错误日志记录
 * - 重试机制
 * - 安全的异步操作
 * 
 * 使用方式：
 * 1. 错误标准化：formatError(anyError)
 * 2. 标准错误处理：handleError(error, showMessage)
 * 3. 安全异步调用：await safeAsync(asyncFn, options)
 * 4. 带重试机制：await withRetry(asyncFn, options)
 * 5. 网络错误判断：isNetworkError(error)
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
 * 检测是否为网络错误
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  // 检查是否为NetworkError实例
  if (error instanceof NetworkError) return true;
  
  // 检查是否是具有网络错误类型的AppError
  if (error instanceof AppError && error.type === ErrorType.NETWORK) return true;
  
  // 检查常见的网络错误消息模式
  const errorMessage = typeof error.message === 'string' ? error.message.toLowerCase() : '';
  const networkErrorPatterns = [
    'network error',
    'networkerror',
    'failed to fetch',
    'internet disconnected',
    'net::err',
    'aborted',
    'cannot connect',
    'connection refused',
    'connection failed',
    'socket hang up',
    'socket timeout',
    'timeout',
    'econnreset',
    'econnaborted',
    'etimedout',
    '网络错误',
    '连接失败',
    '连接超时',
    '连接被拒绝'
  ];
  
  return networkErrorPatterns.some(pattern => errorMessage.includes(pattern));
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
  if (isNetworkError(error)) {
    return new NetworkError(
      typeof error.message === 'string' ? error.message : '网络连接失败，请检查网络设置',
      { originalError: error }
    );
  }
  
  // API响应错误（常见格式）
  if (error && typeof error === 'object') {
    // 包含状态码的HTTP错误
    if ('status' in error || 'statusCode' in error) {
      const statusCode = (error.status as number) || (error.statusCode as number);
      const message = error.message || error.error || '请求失败';
      const code = error.code;
      
      if (statusCode === 404) {
        return new NotFoundError(message, { originalError: error });
      }
      
      if (statusCode === 401 || statusCode === 403) {
        return new PermissionError(message, { originalError: error });
      }
      
      if (statusCode === 400) {
        return new ValidationError(message, { originalError: error });
      }
      
      if (statusCode === 408 || statusCode === 504) {
        return new TimeoutError(message, { originalError: error });
      }
      
      return new ApiError(message, statusCode, code, { originalError: error });
    }
    
    // 标准API错误格式 { error, message, code, etc. }
    if ('error' in error || 'message' in error) {
      const errorMessage = error.error || error.message || '请求失败';
      const statusCode = error.status || error.statusCode;
      const errorCode = error.code;
      return new ApiError(errorMessage, statusCode, errorCode, { originalError: error });
    }
    
    // 文件错误
    if (error.type && typeof error.type === 'string' && error.type.startsWith('file_')) {
      // 尝试从错误类型中提取文件错误类型
      const fileErrorType = error.type as string;
      const fileErrorTypeMap: Record<string, ErrorType> = {
        'file_upload': ErrorType.FILE_UPLOAD,
        'file_download': ErrorType.FILE_DOWNLOAD,
        'file_delete': ErrorType.FILE_DELETE,
        'file_access': ErrorType.FILE_ACCESS
      };
      
      const errorType = fileErrorTypeMap[fileErrorType] || ErrorType.UNKNOWN;
      return new FileError(error.message || '文件操作失败', errorType, { originalError: error });
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
 * 统一的错误处理函数
 * 标准化错误，显示通知，记录日志
 * 
 * @param error 任何类型的错误
 * @param showMessage 是否显示错误消息通知
 * @param logLevel 日志级别
 * @param defaultMessage 默认错误消息
 * @returns 标准化的AppError对象
 */
export function handleError(
  error: any,
  showMessage = true,
  logLevel: 'error' | 'warn' | 'info' = 'error',
  defaultMessage = '操作失败，请重试'
): AppError {
  // 标准化错误对象
  const appError = formatError(error);
  
  // 如果提供了默认消息且错误消息为空或未定义，使用默认消息
  if (defaultMessage && (!appError.message || appError.message === '发生未知错误')) {
    appError.message = defaultMessage;
  }
  
  // 显示错误消息
  if (showMessage) {
    // 针对不同类型的错误给出不同的处理建议
    let messageContent = appError.message;
    
    // 对于网络错误，添加建议
    if (appError instanceof NetworkError) {
      messageContent = `${messageContent}，请检查网络连接`;
    }
    
    // 对于超时错误，添加建议
    if (appError instanceof TimeoutError) {
      messageContent = `${messageContent}，请稍后重试`;
    }
    
    message.error(messageContent);
  }
  
  // 记录错误日志
  if (logLevel === 'error') {
    console.error('[错误]', appError.message, appError);
  } else if (logLevel === 'warn') {
    console.warn('[警告]', appError.message, appError);
  } else {
    console.info('[信息]', appError.message, appError);
  }
  
  return appError;
}

/**
 * 带有重试功能的错误处理
 * 
 * @param fn 要执行的异步函数
 * @param options 重试选项
 * @returns 函数执行结果Promise
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    delay?: number;
    onRetry?: (error: any, attempt: number) => void;
    shouldRetry?: (error: any) => boolean;
    progressiveDelay?: boolean;
  } = {}
): Promise<T> {
  const {
    retries = 3,
    delay = 1000,
    onRetry,
    shouldRetry = (error) => isNetworkError(error) || (error instanceof TimeoutError),
    progressiveDelay = true
  } = options;
  
  let lastError: any;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // 最后一次重试失败
      if (attempt === retries) {
        const formattedError = formatError(error);
        // 添加重试信息到错误详情
        formattedError.details = {
          ...formattedError.details,
          retries: retries,
          attempts: attempt + 1
        };
        throw formattedError;
      }
      
      // 检查是否应该重试
      if (!shouldRetry(error)) {
        throw formatError(error);
      }
      
      // 调用重试回调
      if (onRetry) {
        onRetry(error, attempt + 1);
      }
      
      // 等待后重试，可选择性地增加延迟时间
      const waitTime = progressiveDelay ? delay * Math.pow(2, attempt) : delay;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  // 不应该到达这里，但为了类型安全
  throw formatError(lastError || new Error('操作失败'));
}

/**
 * 处理异步操作的包装器，提供统一的错误处理
 * 
 * @param asyncFn 异步函数
 * @param errorOptions 错误处理选项
 * @returns 处理后的Promise
 */
export async function safeAsync<T>(
  asyncFn: () => Promise<T>,
  errorOptions: {
    showError?: boolean;
    errorMessage?: string;
    fallbackValue?: T;
    rethrow?: boolean;
    logLevel?: 'error' | 'warn' | 'info';
  } = {}
): Promise<T | null> {
  const {
    showError = true,
    errorMessage,
    fallbackValue = null as unknown as T,
    rethrow = false,
    logLevel = 'error'
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
    handleError(appError, showError, logLevel);
    
    // 是否重新抛出错误
    if (rethrow) {
      throw appError;
    }
    
    // 返回后备值
    return fallbackValue;
  }
}

/**
 * 创建支持超时的fetch请求
 * 
 * @param url 请求URL
 * @param options 请求选项
 * @param timeout 超时时间（毫秒）
 * @returns 响应Promise
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 15000
): Promise<Response> {
  // 创建AbortController用于超时取消
  const controller = new AbortController();
  const { signal } = controller;
  
  // 合并原有signal和新创建的signal
  const finalOptions: RequestInit = {
    ...options,
    signal
  };
  
  // 创建超时Promise
  const timeoutPromise = new Promise<Response>((_, reject) => {
    const id = setTimeout(() => {
      controller.abort();
      reject(new TimeoutError(`请求超时，超过${timeout}ms未响应`));
    }, timeout);
    
    // 如果signal已经被触发，清除超时
    if (signal) {
      signal.addEventListener('abort', () => clearTimeout(id));
    }
  });
  
  // 创建实际fetch请求Promise
  const fetchPromise = fetch(url, finalOptions);
  
  // 使用Promise.race竞争，谁先完成用谁的结果
  return Promise.race([fetchPromise, timeoutPromise]);
}

/**
 * API响应数据接口
 */
export interface ApiDataResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
  code?: string | number;
}

/**
 * 通用错误处理的异步API调用包装器
 * 
 * @param apiCall API调用函数
 * @param options 错误处理选项
 * @returns 响应数据或null
 */
export async function withErrorHandling<T>(
  apiCall: () => Promise<ApiDataResponse<T> | T>,
  options: {
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
  } = options;
  
  try {
    const response = await apiCall();
    
    // 检查是否是API标准响应格式
    if (response && typeof response === 'object' && 'success' in response) {
      const apiResponse = response as ApiDataResponse<T>;
      if (!apiResponse.success) {
        throw new ApiError(
          apiResponse.error || apiResponse.message || '请求失败',
          undefined,
          apiResponse.code
        );
      }
      return apiResponse.data;
    }
    
    // 不是标准API响应，直接返回数据
    return response as T;
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

/**
 * 统一处理API响应结果
 * 根据响应状态进行错误处理或返回响应数据
 * 
 * @param response fetch API的Response对象
 * @param errorMessage 错误提示消息
 * @returns 解析后的响应数据
 * @throws 当响应不成功时抛出错误
 */
export async function handleApiResponse<T>(response: Response, errorMessage = '请求失败'): Promise<T> {
  if (!response.ok) {
    // 尝试获取错误详情
    let errorDetail = '';
    try {
      const errorData = await response.json();
      errorDetail = errorData.message || errorData.error || `状态码: ${response.status}`;
    } catch (e) {
      errorDetail = `状态码: ${response.status}`;
    }
    
    // 创建并抛出错误
    throw createFileError('access', `${errorMessage}: ${errorDetail}`);
  }
  
  // 成功响应，返回数据
  return await response.json() as T;
}
