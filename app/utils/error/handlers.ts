/**
 * 错误处理工具函数
 * 提供统一的错误处理机制
 */

import { ErrorInfo, ErrorType } from './types';

// 创建错误信息
export const createError = (type: ErrorType, message: string, details?: any): ErrorInfo => ({
  type,
  message,
  details,
  timestamp: new Date().toISOString()
});

// 错误处理函数
export const handleError = (error: ErrorInfo) => {
  // 记录错误日志
  console.error(`[${error.type}] ${error.message}`, {
    details: error.details,
    timestamp: error.timestamp
  });

  // 根据错误类型返回用户友好的错误信息
  switch (error.type) {
    case 'FILE_UPLOAD':
      return '文件上传失败，请重试';
    case 'FILE_DOWNLOAD':
      return '文件下载失败，请重试';
    case 'FILE_DELETE':
      return '文件删除失败，请重试';
    case 'NETWORK':
      return '网络连接失败，请检查网络设置';
    default:
      return '操作失败，请重试';
  }
};

// 日志记录函数
export const logError = (context: string, error: any) => {
  console.error(`[${context}]`, {
    message: error?.message || error,
    stack: error?.stack,
    timestamp: new Date().toISOString()
  });
};
