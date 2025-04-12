/**
 * API响应相关类型定义
 * 
 * 包含API响应结构和格式的类型定义
 */

import { FileInfo } from '../files/file';
import { ApiResponse } from '../core/api';

// 分页响应接口
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 文件列表响应接口
export interface FileListResponse extends ApiResponse {
  data: FileInfo[];
  total?: number;
  page?: number;
  limit?: number;
}

// 文件详情响应接口
export interface FileDetailResponse extends ApiResponse {
  data: FileInfo;
}

// 文件操作响应接口
export interface FileOperationResponse extends ApiResponse {
  data: {
    affected: number;
    ids: string[];
  };
}

// 存储使用情况响应
export interface StorageUsageResponse extends ApiResponse {
  data: {
    used: number;
    total: number;
    percentage: number;
    typeStats?: {
      type: string;
      size: number;
      count: number;
      percentage: number;
    }[];
  };
}

// 认证响应接口
export interface AuthResponse extends ApiResponse {
  data: {
    user: {
      id: string;
      name: string | null;
      email: string;
    };
    token?: string;
  };
}

// 搜索响应接口
export interface SearchResponse<T = any> extends ApiResponse {
  data: T[];
  total?: number;
  query?: string;
} 