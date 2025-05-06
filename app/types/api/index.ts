import { 
  ApiResponse as SharedApiResponse,
  PaginatedResponse as SharedPaginatedResponse,
  FileUploadResponse as SharedFileUploadResponse,
  FileOperationResponse as SharedFileOperationResponse
} from '@/app/types/shared/api-types';

// 为了向后兼容，保持ApiResponse的导出
export type ApiResponse = SharedApiResponse;

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
export interface ApiDataResponse<T> extends ApiResponse {
  data: T;
}

/**
 * 文件系统路径项接口
 * 表示文件路径导航中的单个项目
 */
export interface FolderPathItem {
  id: string;
  name: string;
}

/**
 * 文件夹路径API响应接口
 * 用于文件导航路径的API响应
 */
export interface FolderPathResponse extends ApiResponse {
  data: {
    path: FolderPathItem[];
  };
}

/**
 * 带分页的API响应接口
 * 用于返回分页数据的API响应
 */
export type ApiPaginatedResponse<T> = SharedPaginatedResponse<T>;

/**
 * 文件上传响应接口
 */
export type FileUploadResponse = SharedFileUploadResponse;

/**
 * 文件操作响应接口
 */
export type FileOperationResponse = SharedFileOperationResponse;
