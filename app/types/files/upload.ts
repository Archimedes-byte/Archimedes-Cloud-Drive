/**
 * 文件上传相关类型定义
 * 
 * 包含文件上传过程和状态相关的类型定义
 */

// 文件进度接口 - 用于上传过程
export interface FileWithProgress {
  file: File; // 原生File类型
  id: string;
  name: string;
  relativePath?: string;
  progress: {
    loaded: number;
    total: number;
    percentage: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
  };
}

// 上传进度跟踪接口
export interface UploadProgress {
  [key: string]: FileWithProgress;
}

// 上传状态
export type UploadStatus = 'idle' | 'preparing' | 'uploading' | 'success' | 'error' | 'canceled';

// 上传请求配置
export interface UploadOptions {
  folderId?: string | null;
  tags?: string[];
  onProgress?: (progress: number) => void;
  onComplete?: (files: any[]) => void;
  onError?: (error: Error) => void;
}

// 上传结果接口
export interface UploadResult {
  success: boolean;
  files: any[];
  failedFiles: {
    file: File;
    error: string;
  }[];
}

// 上传属性接口
export interface FileUploadProps {
  onUploadComplete: () => void;
  folderId?: string | null;
  withTags?: boolean;
  isFolderUpload?: boolean;
}

// 文件上传请求
export interface FileUploadRequest {
  files: File[];
  tags?: string[];
  folderId?: string | null;
  path?: string;
} 