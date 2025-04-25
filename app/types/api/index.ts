export * from './requests';

export * from './responses';

export * from '../core/api';

/**
 * API响应接口定义
 * 提供统一的API响应类型
 */

/**
 * 基础API响应接口
 * 所有API响应都应符合此接口
 */
export interface ApiResponse {
  success: boolean;
  error?: string;
}

/**
 * 带数据的API响应接口
 * 用于返回数据的API响应
 */
export interface ApiDataResponse<T> extends ApiResponse {
  data: T;
}

/**
 * 带分页的API响应接口
 * 用于返回分页数据的API响应
 */
export interface ApiPaginatedResponse<T> extends ApiDataResponse<T[]> {
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

/**
 * 文件上传响应接口
 */
export interface FileUploadResponse extends ApiResponse {
  file?: {
    id: string;
    name: string;
    path: string;
    size: number;
    type: string;
  };
}

/**
 * 文件操作响应接口
 */
export interface FileOperationResponse extends ApiResponse {
  fileId?: string;
  message?: string;
}

/**
 * 文件夹路径响应接口
 */
export interface FolderPathResponse extends ApiResponse {
  path: Array<{
    id: string;
    name: string;
  }>;
}
