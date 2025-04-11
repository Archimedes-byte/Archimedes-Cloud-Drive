/**
 * 通用类型定义
 * 
 * 包含应用中共享的基础类型定义，如分页、排序等
 */

// 分页请求参数接口
export interface PaginationParams {
  page: number;
  limit: number;
}

// 分页响应元数据接口
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// 分页响应接口
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// 排序方向类型
export type SortDirection = 'asc' | 'desc';

// 排序参数接口
export interface SortParams {
  field: string;
  direction: SortDirection;
}

// ID参数接口
export interface IdParam {
  id: string;
}

// 错误代码枚举
export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  STORAGE_LIMIT_EXCEEDED = 'STORAGE_LIMIT_EXCEEDED',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
}

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

// 配置接口
export interface AppConfig {
  apiUrl: string;
  maxUploadSize: number;
  allowedFileTypes: string[];
  version: string;
}

// 通用键值对接口
export interface KeyValuePair<T = any> {
  key: string;
  value: T;
} 