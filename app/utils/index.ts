/**
 * 工具函数集中导出
 * 
 * 这个文件集成各个子领域的工具函数，形成一个完整的工具库
 * 已整合文件管理模块的工具函数，消除冗余：
 * - 合并了file-utils.ts到file/type.ts
 * - 删除了重复的文件排序功能
 * - 标准化了文件类型处理
 */

// 导出格式化工具（除了可能冲突的函数外）
import * as formatUtils from './format';
export const {
  // 显式导出除capitalizeFirstLetter外的所有内容
  cn,
  // 其他format导出的函数...
} = formatUtils;
// 显式导出并重命名，避免冲突
export const formatCapitalizeFirstLetter = formatUtils.capitalizeFirstLetter;

// 导出文件工具
export * from './file';

// 导出字符串工具（除了可能冲突的函数外）
import * as stringUtils from './string';
export const {
  // 显式导出除capitalizeFirstLetter外的所有内容
  randomString,
  // 其他string导出的函数...
} = stringUtils;
// 显式导出并重命名，避免冲突
export const stringCapitalizeFirstLetter = stringUtils.capitalizeFirstLetter;

// 导出存储工具
export * from './storage';

// 导出错误处理工具
// 类型导出
export type { ErrorType, ErrorInfo } from './error';
// 值导出
export { 
  AppError, NetworkError, ApiError, ValidationError, 
  PermissionError, NotFoundError, TimeoutError, 
  FileError, createFileError, isAppError, 
  formatError, handleError, 
  // 显式导出withRetry以消除歧义
  withRetry as errorWithRetry,
  safeAsync 
} from './error';

// 导出函数工具（防抖、节流等）
export * from './function';

// 导出用户工具
export * from './user'; 