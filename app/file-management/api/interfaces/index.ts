import { FileTypeEnum } from '@/app/types/domains/fileTypes';

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
  type?: FileTypeEnum | string | null;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FileSearchRequest {
  query: string;
  type?: FileTypeEnum | string | null;
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
  STORAGE: {
    // 文件操作
    FILES: {
      LIST: '/api/storage/files',
      SEARCH: '/api/storage/files/search',
      UPLOAD: '/api/storage/files/upload',
      DELETE: '/api/storage/files/delete',
      MOVE: '/api/storage/files/move',
      UPDATE: (id: string) => `/api/storage/files/${id}`,
      DOWNLOAD: '/api/storage/files/download',
      PREVIEW: (id: string) => `/api/storage/files/${id}/preview`,
      CONTENT: (id: string) => `/api/storage/files/${id}/content`,
      RENAME: (id: string) => `/api/storage/files/${id}/rename`,
    },
    
    // a文件夹操作
    FOLDERS: {
      LIST: '/api/storage/folders',
      GET: (id: string) => `/api/storage/folders/${id}`,
      CREATE: '/api/storage/folders',
      DELETE: '/api/storage/folders/delete',
      UPDATE: (id: string) => `/api/storage/folders/${id}`,
      CHILDREN: (id: string) => `/api/storage/folders/${id}/children`,
      RENAME: (id: string) => `/api/storage/folders/${id}/rename`,
    },
    
    // 通用存储操作
    INFO: '/api/storage/info',
    QUOTA: '/api/storage/quota',
    RECENT: '/api/storage/recent',
    STATS: '/api/storage/stats',
  }
} as const; 