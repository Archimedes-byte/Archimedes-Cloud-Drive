import { FileInfo } from './file';

// 带进度信息的文件对象
export interface FileWithProgress extends File {
  id: string;
  relativePath: string;
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

// 文件夹结构接口
export interface FolderStructure {
  path: string;
  files: FileWithProgress[];
  subFolders: Map<string, FolderStructure>;
}

// API文件响应接口
export interface FileResponse {
  id: string;
  name: string;
  type: string | null;
  size: number | null;
  isFolder: boolean;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  url: string;
}

// 文件上传组件属性接口
export interface FileUploadProps {
  onUploadComplete: (file: FileInfo) => void; // 使用FileInfo类型代替any
  folderId?: string | null;
  withTags?: boolean;
  isFolderUpload?: boolean;
}

// 上传成功回调类型
export type UploadCompleteHandler = (file: FileInfo) => void;

// 上传错误回调类型
export type UploadErrorHandler = (error: Error) => void;

// 上传进度回调类型
export type UploadProgressHandler = (progress: number) => void;

// 上传模态框属性
export interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId?: string | null;
  onUploadComplete?: UploadCompleteHandler;
}

// 类型映射函数 - 将API响应转换为前端FileInfo模型
export function mapFileResponseToFileInfo(response: FileResponse): FileInfo {
  return {
    id: response.id,
    name: response.name,
    size: response.size || 0,
    type: response.type || '',
    url: response.url,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
    parentId: response.parentId,
    tags: response.tags,
    isFolder: response.isFolder
  };
} 