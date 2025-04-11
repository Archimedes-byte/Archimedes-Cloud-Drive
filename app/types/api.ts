import { FileInfo } from './file';

/**
 * API相关类型定义
 * 
 * 本文件包含与API请求和响应相关的类型定义
 */

// API文件列表响应接口
export interface FileListResponse {
  status: 'success' | 'error';
  data: FileInfo[];
  message?: string;
  error?: string;
  total?: number;
  page?: number;
  limit?: number;
}

// 搜索文件请求接口
export interface SearchFilesRequest {
  query: string;
  type?: string;
  tags?: string[];
  limit?: number;
  page?: number;
}

// 上传文件请求接口
export interface UploadFileRequest {
  file: File;
  folderId?: string | null;
  tags?: string[];
}

// 创建文件夹请求接口
export interface CreateFolderRequest {
  name: string;
  parentId?: string | null;
  tags?: string[];
}

// 重命名文件请求接口
export interface RenameFileRequest {
  id: string;
  name: string;
}

// 移动文件请求接口
export interface MoveFileRequest {
  id: string;
  targetFolderId: string | null;
}

// 删除文件请求接口
export interface DeleteFileRequest {
  id: string;
  permanent?: boolean;
}

// 批量删除文件请求接口
export interface BulkDeleteRequest {
  ids: string[];
  permanent?: boolean;
}

// 恢复文件请求接口
export interface RestoreFileRequest {
  id: string;
}

// 更新文件标签请求接口
export interface UpdateTagsRequest {
  id: string;
  tags: string[];
} 