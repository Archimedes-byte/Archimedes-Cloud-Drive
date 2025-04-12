/**
 * 核心API类型定义
 * 
 * 包含与API交互相关的基础类型定义
 */

// 响应状态接口
export interface ResponseStatus {
  success: boolean;
  message?: string;
  code?: string | number;
}

// API基础响应接口
export interface ApiResponse<T = any> extends ResponseStatus {
  data?: T;
  errors?: Record<string, string[]>;
}

// 统一错误响应
export interface ErrorResponse {
  success: false;
  error: string;
  code?: number | string;
  message?: string;
  details?: Record<string, any>;
}

// API错误类
export class ApiError extends Error {
  code: number | string;
  message: string;
  details?: Record<string, any>;

  constructor(message: string, code: number | string = 'UNKNOWN_ERROR', details?: Record<string, any>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.message = message;
    this.details = details;
  }
}

// 配置接口
export interface AppConfig {
  apiUrl: string;
  maxUploadSize: number;
  allowedFileTypes: string[];
  version: string;
} 