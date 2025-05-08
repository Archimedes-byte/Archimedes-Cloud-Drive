import { FileWithUIState, FileTypeEnum } from '../domains/fileTypes';
import { 
  ApiResponse, 
  FileOperationResponse as SharedFileOperationResponse,
  AuthResponse as SharedAuthResponse,
  PaginatedResponse as SharedPaginatedResponse,
  UserBasic
} from '@/app/types';

/**
 * 文件列表响应接口
 * 扩展基础API响应类型
 */
export interface FileListResponse extends ApiResponse {
  data: FileWithUIState[];
  total?: number;
  page?: number;
  limit?: number;
}

/**
 * 文件详情响应接口
 * 扩展基础API响应类型
 */
export interface FileDetailResponse extends ApiResponse {
  data: FileWithUIState;
}

/**
 * 自定义文件操作响应
 * 扩展共享文件操作响应类型
 */
export interface CustomFileOperationResponse extends SharedFileOperationResponse {
  data?: {
    affected: number;
    ids: string[];
  };
}

/**
 * 文件类型统计信息
 */
export interface FileTypeStats {
  type: FileTypeEnum | string;
  size: number;
  count: number;
  percentage: number;
}

/**
 * 导出共享AuthResponse类型
 */
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
 * 使用共享分页响应类型
 * @template T 分页数据项的类型
 */
export type PaginatedApiResponse<T> = SharedPaginatedResponse<T>; 