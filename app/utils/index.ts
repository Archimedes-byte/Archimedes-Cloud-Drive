/**
 * 工具函数集中导出
 * 
 * 这个文件集成各个子领域的工具函数，形成一个完整的工具库
 * 已整合文件管理模块的工具函数，消除冗余：
 * - 合并了file-utils.ts到file/type.ts
 * - 删除了重复的文件排序功能
 * - 标准化了文件类型处理
 */

// 导出格式化工具
export * from './format';

// 导出文件相关工具
export * from './file';

// 导出存储相关工具
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

// 导出日期处理工具
export * from './date';

// 导出验证工具
export * from './validation';

// 导出安全工具
export * from './security';

// 导出函数工具（防抖、节流等）
export * from './function'; 