import { FileType } from '../../types/index';

// 基础响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
  message?: string;
}

// 文件相关接口
export interface FileListRequest {
  folderId?: string | null;
  type?: FileType | null;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FileSearchRequest {
  query: string;
  type?: FileType | null;
  tags?: string[];
}

export interface FileUploadRequest {
  files: File[];
  tags?: string[];
  folderId?: string | null;
  path?: string;
}

export interface FileDeleteRequest {
  fileIds: string[];
}

export interface FileMoveRequest {
  fileIds: string[];
  targetFolderId: string;
}

export interface FileUpdateRequest {
  name?: string;
  tags?: string[];
}

// 文件夹相关接口
export interface FolderCreateRequest {
  name: string;
  parentId?: string | null;
  tags?: string[];
}

// 分页响应接口
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// API 路径常量
export const API_PATHS = {
  FILES: {
    LIST: '/file_management/api/files',
    SEARCH: '/file_management/api/files/search',
    UPLOAD: '/file_management/api/files/upload',
    DELETE: '/file_management/api/files/delete',
    MOVE: '/file_management/api/files/move',
    UPDATE: (id: string) => `/file_management/api/files/${id}`,
    DOWNLOAD: '/file_management/api/files/download',
  },
  FOLDERS: {
    CREATE: '/file_management/api/folders',
    LIST: '/file_management/api/folders',
    DELETE: '/file_management/api/folders/delete',
  }
} as const; 