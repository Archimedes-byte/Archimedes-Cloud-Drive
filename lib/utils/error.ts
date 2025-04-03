// 错误类型定义
export type ErrorType = 'FILE_UPLOAD' | 'FILE_DOWNLOAD' | 'FILE_DELETE' | 'FILE_PREVIEW' | 'NETWORK' | 'UNKNOWN';

// 错误信息接口
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: string;
}

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
    case 'FILE_PREVIEW':
      return '文件预览失败，请检查文件格式';
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

// 格式化错误消息
export const formatErrorMessage = (error: any): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '未知错误';
}; 