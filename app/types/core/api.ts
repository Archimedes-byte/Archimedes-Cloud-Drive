/**
 * 核心API类型定义
 * 
 * 包含与API交互相关的基础类型定义
 */

import { 
  ApiResponse as SharedApiResponse, 
  ResponseStatus,
  ErrorResponse as SharedErrorResponse,
  ApiError as SharedApiError
} from '@/app/types/shared/api-types';

// 导出共享类型
export type { 
  ResponseStatus,
  SharedErrorResponse as ErrorResponse,
  SharedApiError as ApiError
};

// 为了向后兼容，保持ApiResponse的导出
export type ApiResponse<T = any> = SharedApiResponse<T>;

// 配置接口
export interface AppConfig {
  apiUrl: string;
  maxUploadSize: number;
  allowedFileTypes: string[];
  version: string;
} 