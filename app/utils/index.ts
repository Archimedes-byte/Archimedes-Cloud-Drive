/**
 * 工具函数集中导出
 * 
 * 这个文件集成各个子领域的工具函数，形成一个完整的工具库
 * 已清理和规范化的导出机制，避免命名冲突和重复导出
 */

// UI工具函数
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 导出字符串处理工具
export * from './string';

// 导出日期处理工具
export * from './date';

// 导出格式化工具（使用命名空间避免冲突）
import * as formatUtils from './format/index';
export const format = formatUtils;

// 导出错误处理工具（解决命名冲突）
import * as errorUtils from './error';
export const errors = errorUtils; // 导出为命名空间
// 重新导出主要的错误类型和处理函数，但避开可能冲突的withRetry
export { 
  AppError, NetworkError, ApiError, ValidationError, 
  PermissionError, NotFoundError, TimeoutError, 
  FileError, createFileError, isAppError, 
  formatError, handleError, safeAsync 
} from './error';

// 导出函数工具（防抖、节流等）
export * from './function';

// 导出API请求工具
export * from './api';

// 导出日志工具
export * from './logger';

// 导出验证工具
export * from './validation';

// 导出安全工具
export * from './security';

// 导出用户工具
export * from './user';

// 文件处理工具导出为命名空间，避免与其他模块冲突
import * as fileUtils from './file';
export const file = fileUtils; 