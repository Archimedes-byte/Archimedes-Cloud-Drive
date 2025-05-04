/**
 * 认证错误处理
 * 
 * 提供统一的认证错误创建、格式化和处理功能
 */
import { AUTH_ERROR_CODE } from '@/app/constants/auth';

/**
 * 认证错误类
 */
export class AuthError extends Error {
  code: AUTH_ERROR_CODE;
  status: number;
  
  constructor(message: string, code: AUTH_ERROR_CODE, status = 400) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
    
    // 捕获堆栈跟踪
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 创建认证错误实例
 */
export function createAuthError(
  message: string,
  code: AUTH_ERROR_CODE,
  status = 400
): AuthError {
  return new AuthError(message, code, status);
}

/**
 * 获取用户友好的错误消息
 * 不暴露敏感系统信息
 */
export function getFriendlyErrorMessage(error: unknown): string {
  // 安全地处理认证错误
  if (error instanceof AuthError) {
    return error.message;
  }
  
  // 处理常规错误，但避免暴露堆栈跟踪或详细信息
  if (error instanceof Error) {
    // 安全考虑：检查是否包含敏感信息，只返回预定义的安全消息
    if (isErrorSafe(error.message)) {
      return error.message;
    }
    
    // 返回通用错误消息
    return '发生错误，请稍后再试';
  }
  
  return '发生未知错误';
}

/**
 * 检查错误消息是否安全（不包含敏感信息）
 */
function isErrorSafe(message: string): boolean {
  // 检查是否包含可能的敏感信息关键词
  const sensitivePatterns = [
    /database|db|sql|query/i,     // 数据库相关
    /exception|stack trace/i,      // 异常堆栈
    /internal server|服务器内部/i, // 内部服务器
    /file|directory|path/i,       // 文件路径
    /config|配置|env|环境/i,       // 配置信息
    /key|密钥|token|secret/i,      // 密钥信息
    /password|密码/i,              // 密码信息
    /crash|崩溃|dump/i             // 崩溃信息
  ];
  
  // 检查错误消息是否匹配任何敏感模式
  return !sensitivePatterns.some(pattern => pattern.test(message));
}

/**
 * 错误代码到用户友好消息的映射
 */
const ERROR_MESSAGES: Record<AUTH_ERROR_CODE, string> = {
  [AUTH_ERROR_CODE.INVALID_CREDENTIALS]: '邮箱或密码不正确',
  [AUTH_ERROR_CODE.ACCOUNT_NOT_FOUND]: '邮箱或密码不正确', // 安全考虑：统一错误消息
  [AUTH_ERROR_CODE.EMAIL_EXISTS]: '该邮箱已被注册',
  [AUTH_ERROR_CODE.PASSWORD_MISMATCH]: '邮箱或密码不正确', // 安全考虑：统一错误消息
  [AUTH_ERROR_CODE.SESSION_EXPIRED]: '会话已过期，请重新登录',
  [AUTH_ERROR_CODE.UNAUTHORIZED]: '未授权的操作',
  [AUTH_ERROR_CODE.VALIDATION_ERROR]: '验证失败',
  [AUTH_ERROR_CODE.SERVER_ERROR]: '服务器暂时无法处理请求，请稍后再试',
};

/**
 * 根据错误代码获取标准错误消息
 */
export function getStandardErrorMessage(code: AUTH_ERROR_CODE): string {
  return ERROR_MESSAGES[code] || '发生未知错误';
}

/**
 * 记录认证错误
 * 避免在生产环境泄露详细错误信息
 */
export function logAuthError(error: unknown, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    // 开发环境记录详细信息
    console.error(`Auth Error${context ? ` (${context})` : ''}:`, error);
  } else {
    // 生产环境下只记录最小信息，避免泄露
    const errorMessage = error instanceof Error 
      ? sanitizeErrorMessage(error.message) 
      : typeof error === 'string' 
        ? sanitizeErrorMessage(error) 
        : 'Unknown error';
    
    // 只记录错误类型和安全的错误消息
    console.error(`Auth Error${context ? ` (${context})` : ''}: ${errorMessage}`);
    
    // 可以集成第三方日志服务，但确保不发送敏感信息
    // 例如: logger.error({ context, message: errorMessage });
  }
}

/**
 * 净化错误消息，移除可能的敏感信息
 */
function sanitizeErrorMessage(message: string): string {
  // 移除可能包含路径的部分
  let sanitized = message.replace(/([A-Za-z]:\\|\/var\/|\/home\/|\/usr\/|\/etc\/)[^\s]*/g, '[PATH]');
  
  // 移除可能的IP地址
  sanitized = sanitized.replace(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g, '[IP]');
  
  // 移除可能的邮箱地址
  sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
  
  // 移除可能的SQL查询
  sanitized = sanitized.replace(/SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|AND|OR/gi, '[SQL]');
  
  return sanitized;
}

/**
 * 创建API错误响应
 */
export function createErrorResponse(message: string, status = 400) {
  // 确保错误消息不包含敏感信息
  const safeMessage = process.env.NODE_ENV === 'production' 
    ? sanitizeErrorMessage(message) 
    : message;
  
  return new Response(
    JSON.stringify({
      success: false,
      error: safeMessage
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * 创建API成功响应
 */
export function createSuccessResponse(data: any, message?: string, status = 200) {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      message
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
} 