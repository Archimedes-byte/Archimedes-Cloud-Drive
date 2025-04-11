/**
 * 文件系统核心类型定义
 * 
 * 本文件包含所有基础文件类型定义，主要关注文件实体、操作和数据模型，
 * 其他更专业化的类型（如UI组件属性、上下文等）应放在fileManagement.ts中
 */

// 文件类型枚举
export type FileType = 'image' | 'document' | 'video' | 'audio' | 'archive' | 'folder' | 'other' | 'code';

// 排序顺序
export interface SortOrder {
  field: string;
  direction: 'asc' | 'desc';
}

// 文件夹路径项
export interface FolderPath {
  id: string;
  name: string;
}

// 基础文件信息接口 - 核心文件属性
export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  isFolder: boolean;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  url: string;
  tags: string[];
  path: string | null;
  extension?: string;
  metadata?: Record<string, any>;
  selected?: boolean;
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
  path?: string;
}

// 定义文件实体接口 - 基于Prisma模型
export interface FileEntity {
  id: string;
  name: string;
  filename: string;
  path: string;
  type: string | null;
  size: number | null;
  isFolder: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  parentId: string | null;
  uploaderId: string;
  tags: string[];
  url: string | null;
}

// 文件上传进度接口
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

// 文件夹结构接口
export interface FolderStructure {
  path: string;
  files: FileWithProgress[];
  subFolders: Map<string, FolderStructure>;
}

// 存储使用情况接口
export interface StorageUsageInfo {
  used: number;
  total: number;
}

// MIME类型与文件类型的映射
export const FILE_TYPE_MAP: Record<FileType, { mimeTypes: string[]; extensions: string[] }> = {
  image: {
    mimeTypes: ['image'],
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico']
  },
  document: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml',
      'text'
    ],
    extensions: ['doc', 'docx', 'txt', 'pdf', 'xls', 'xlsx', 'ppt', 'pptx', 'rtf', 'csv', 'md']
  },
  video: {
    mimeTypes: ['video'],
    extensions: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'ogv']
  },
  audio: {
    mimeTypes: ['audio'],
    extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac']
  },
  archive: {
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
    extensions: ['zip', 'rar', '7z', 'tar', 'gz']
  },
  folder: {
    mimeTypes: ['folder'],
    extensions: []
  },
  code: {
    mimeTypes: ['text/plain', 'application/json', 'text/html', 'text/css', 'application/javascript'],
    extensions: ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rb', 'php', 'html', 'css', 'xml', 'json']
  },
  other: {
    mimeTypes: [],
    extensions: []
  }
};

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
    isFolder: response.isFolder,
    path: response.path || null
  };
}

// 类型映射函数 - 将数据库实体转换为前端显示模型
export function mapFileEntityToFileInfo(entity: FileEntity): FileInfo {
  // 提取扩展名
  let extension: string | undefined;
  if (!entity.isFolder && entity.name) {
    const parts = entity.name.split('.');
    if (parts.length > 1) {
      extension = parts.pop();
    }
  }

  return {
    id: entity.id,
    name: entity.name,
    size: entity.size || 0,
    type: entity.type || '',
    url: entity.url || '',
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
    parentId: entity.parentId,
    tags: entity.tags,
    isFolder: entity.isFolder,
    path: entity.path,
    extension
  };
} 