/**
 * API响应适配器
 * 
 * 提供统一的前后端响应格式处理，确保一致性
 */
import { ApiResponse } from '@/app/types';
import { createSuccessResponse as utilsCreateSuccessResponse } from '@/app/utils/api/response-builder';

/**
 * 将API响应转换为统一格式
 */
export function adaptApiResponse<T>(response: Response, data: any): ApiResponse<T> {
  if (!response.ok) {
    return {
      success: false,
      error: data.error || `请求失败: ${response.status}`,
      statusCode: response.status
    };
  }
  
  return {
    success: true,
    data: data.data || data,
    message: data.message,
    statusCode: response.status
  };
}

/**
 * 将错误转换为标准API响应
 */
export function adaptErrorToResponse(error: unknown): ApiResponse {
  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
      statusCode: 500
    };
  }
  
  if (typeof error === 'string') {
    return {
      success: false,
      error: error,
      statusCode: 500
    };
  }
  
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const errorObj = error as { message: string; status?: number };
    return {
      success: false,
      error: errorObj.message || '处理请求时发生错误',
      statusCode: errorObj.status || 500
    };
  }
  
  return {
    success: false,
    error: '处理请求时发生未知错误',
    statusCode: 500
  };
}

/**
 * 创建成功响应 - 内部调用utils中的实现
 * 为了保持兼容性，此方法被保留，但内部实现使用utils中的函数
 * 新代码应直接使用utils/api中的方法
 */
export function createClientSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  // 使用utils中的实现，但需要手动处理message，因为两者接口不完全一样
  const response = utilsCreateSuccessResponse(data) as any;
  if (message) {
    response.data.message = message;
  }
  return {
    success: true,
    data,
    message,
    statusCode: 200
  };
}

/**
 * 创建错误响应
 */
export function createClientErrorResponse(error: string, statusCode: number = 400): ApiResponse {
  return {
    success: false,
    error,
    statusCode
  };
} 