import { FileInfo } from './file';
import { UserInfo } from './user';

// 通用API响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 文件列表响应接口
export interface FileListResponse extends ApiResponse<FileInfo[]> {
  currentFolder?: {
    id: string | null;
    name: string;
    path: string[];
  };
}

// 用户信息响应接口
export interface UserInfoResponse extends ApiResponse<UserInfo> {}

// 存储使用情况响应接口
export interface StorageInfoResponse extends ApiResponse<{
  used: number;
  total: number;
}> {}

// 上传文件请求参数
export interface UploadFileRequest {
  file: File;
  folderId?: string | null;
  tags?: string[];
}

// 创建文件夹请求参数
export interface CreateFolderRequest {
  name: string;
  parentId?: string | null;
  tags?: string[];
}

// 重命名文件/文件夹请求参数
export interface RenameFileRequest {
  id: string;
  newName: string;
}

// 移动文件/文件夹请求参数
export interface MoveFileRequest {
  id: string;
  targetFolderId: string | null;
}

// 删除文件/文件夹请求参数
export interface DeleteFileRequest {
  id: string;
}

// 搜索文件请求参数
export interface SearchFilesRequest {
  query: string;
  type?: string;
} 