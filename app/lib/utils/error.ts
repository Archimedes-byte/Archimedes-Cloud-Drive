/**
 * 错误处理工具函数 (Error Handling Utilities)
 * 
 * 提供库内部使用的错误处理工具函数，用于创建、格式化和检测错误。
 */

// 定义库错误类型
export interface LibError extends Error {
  code: string;
  context?: Record<string, any>;
  isLibError: true;
}

/**
 * 创建库错误
 * 
 * @param message - 错误消息
 * @param code - 错误代码
 * @param context - 错误上下文数据
 * @returns LibError类型的错误对象
 */
export function createError(
  message: string, 
  code: string = 'LIB_ERROR', 
  context?: Record<string, any>
): LibError {
  const error = new Error(message) as LibError;
  error.code = code;
  error.context = context;
  error.isLibError = true;
  return error;
}

/**
 * 检查错误是否为库错误
 * 
 * @param error - 要检查的错误对象
 * @returns 如果是库错误则返回true
 */
export function isLibError(error: any): error is LibError {
  return error && error.isLibError === true;
}

/**
 * 格式化库错误
 * 
 * @param error - 要格式化的错误对象
 * @returns 格式化后的错误信息
 */
export function formatError(error: Error | LibError): string {
  if (isLibError(error)) {
    return `${error.code}: ${error.message}`;
  }
  return error.message;
} 