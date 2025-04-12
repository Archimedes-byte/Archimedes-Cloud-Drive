/**
 * 错误类型定义
 * 定义应用中使用的错误类型和接口
 */

// 错误类型枚举
export type ErrorType = 'FILE_UPLOAD' | 'FILE_DOWNLOAD' | 'FILE_DELETE' | 'NETWORK' | 'UNKNOWN';

// 错误信息接口
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: string;
}
