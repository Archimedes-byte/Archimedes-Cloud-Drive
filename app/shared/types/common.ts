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

// 基础时间戳接口
export interface TimeStamps {
  createdAt: string;
  updatedAt: string;
}

// 路径项接口
export interface PathItem {
  id: string | null;
  name: string;
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