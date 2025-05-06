import { FileWithUIState, FileTypeEnum } from '../domains/fileTypes';
import { 
  ApiResponse, 
  FileOperationResponse as SharedFileOperationResponse,
  AuthResponse as SharedAuthResponse,
  PaginatedResponse as SharedPaginatedResponse,
  UserBasic
} from '../shared/api-types';

export interface FileListResponse extends ApiResponse {
  data: FileWithUIState[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface FileDetailResponse extends ApiResponse {
  data: FileWithUIState;
}

// 使用共享类型并扩展
export interface CustomFileOperationResponse extends SharedFileOperationResponse {
  data?: {
    affected: number;
    ids: string[];
  };
}

export interface FileTypeStats {
  type: FileTypeEnum | string;
  size: number;
  count: number;
  percentage: number;
}

/**
 * @deprecated 此接口已移除，相关组件StorageUsage已不再使用
 */
// export interface StorageUsageResponse extends ApiResponse {
//   data: {
//     used: number;
//     total: number;
//     percentage: number;
//     typeStats?: FileTypeStats[];
//   };
// }

// 导出共享AuthResponse类型
export type { SharedAuthResponse as AuthResponse };

/**
 * 搜索响应接口
 * 搜索API的通用响应
 * @template T 搜索结果项的类型
 */
export interface SearchResponse<T = FileWithUIState> extends ApiResponse {
  /** 搜索结果数据 */
  data: T[];
  /** 总记录数 */
  total?: number;
  /** 搜索查询关键词 */
  query?: string;
  /** 搜索耗时(毫秒) */
  took?: number;
}

/**
 * 通用分页响应类型
 * 封装分页数据响应
 * @template T 分页数据项的类型
 */
export type PaginatedApiResponse<T> = SharedPaginatedResponse<T>; 