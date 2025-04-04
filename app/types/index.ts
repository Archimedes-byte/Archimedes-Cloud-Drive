// 文件类型枚举
export enum FileType {
  Folder = 'folder',
  Image = 'image',
  Document = 'document',
  Video = 'video',
  Audio = 'audio',
  Other = 'other'
}

// 文件类型定义
export interface File {
  id: string;
  name: string;
  type: string;
  extension?: string;
  size?: number;
  isFolder?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  parentId?: string | null;
  path?: string;
  tags?: string[];
  userId?: string;
}

// 排序选项定义
export interface SortOrder {
  field: 'name' | 'size' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

// 搜索类型定义
export interface SearchOptions {
  query: string;
  type?: string | null;
  tags?: string[];
  limit?: number;
}

// 文件上传进度定义
export interface UploadProgress {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

// 权限类型定义
export interface Permission {
  id: string;
  fileId: string;
  userId: string;
  email?: string;
  name?: string;
  accessLevel: 'read' | 'write' | 'admin';
  createdAt: string | Date;
} 