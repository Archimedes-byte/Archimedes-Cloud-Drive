// 导出文件相关类型
export * from './file';

// 导出上传相关类型
export * from './upload';

// 导出用户相关类型
export * from './user';

// 导出API相关类型
export * from './api';

// 导出媒体相关类型
export * from './media';

// 导出UI相关类型
export * from './ui';

// 常用类型定义（直接定义在这里而不是导入common.ts）
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