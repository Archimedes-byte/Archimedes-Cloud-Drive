/**
 * 错误格式化工具函数
 * 提供统一的错误消息格式化机制
 */

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

// 格式化错误详情为用户可读形式
export const formatErrorDetails = (details: any): string => {
  if (!details) {
    return '';
  }
  
  if (typeof details === 'string') {
    return details;
  }
  
  if (typeof details === 'object') {
    try {
      return JSON.stringify(details, null, 2);
    } catch (e) {
      return '无法显示详细信息';
    }
  }
  
  return String(details);
};
