/**
 * 统一文件管理系统类型定义
 */

// 文件类型枚举
export type FileType = 'image' | 'document' | 'video' | 'audio' | 'archive' | 'folder' | 'other';

// 基础文件信息接口 - 避免与DOM File类型冲突
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

// 文件夹结构接口
export interface FolderStructure {
  path: string;
  files: FileWithProgress[];
  subFolders: Map<string, FolderStructure>;
}

// 文件夹路径项
export interface FolderPath {
  id: string;
  name: string;
}

// 排序顺序
export interface SortOrder {
  field: string;
  direction: 'asc' | 'desc';
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

// MIME类型与文件类型的映射
export const FILE_TYPE_MAP: Record<FileType, { mimeTypes: string[]; extensions: string[] }> = {
  image: {
    mimeTypes: ['image'],
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
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
    extensions: ['doc', 'docx', 'txt', 'pdf', 'xls', 'xlsx', 'ppt', 'pptx', 'rtf', 'csv']
  },
  video: {
    mimeTypes: ['video'],
    extensions: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv']
  },
  audio: {
    mimeTypes: ['audio'],
    extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a']
  },
  archive: {
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
    extensions: ['zip', 'rar', '7z', 'tar', 'gz']
  },
  folder: {
    mimeTypes: ['folder'],
    extensions: []
  },
  other: {
    mimeTypes: [],
    extensions: []
  }
};

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

// 文件夹信息接口
export interface FolderInfo {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

// 文件树节点接口
export interface FileTreeNode {
  name: string;
  type: 'file' | 'folder';
  size: number;
  children?: FileTreeNode[];
  file?: globalThis.File & { webkitRelativePath?: string };
}

// 存储使用情况接口
export interface StorageUsageInfo {
  used: number;
  total: number;
}

// 类型映射函数 - 将数据库实体转换为前端显示模型
export function mapFileEntityToFileInfo(entity: FileEntity): FileInfo {
  // 提取扩展名
  let extension: string | undefined;
  if (entity.name && !entity.isFolder) {
    const parts = entity.name.split('.');
    if (parts.length > 1) {
      extension = parts[parts.length - 1].toLowerCase();
    }
  }
  
  // 确保文件类型有值
  let type = entity.type || '';
  
  // 如果类型为空，尝试从扩展名推断
  if (!type && extension) {
    // 图片扩展名
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) {
      type = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
    }
    // 文档扩展名
    else if (['doc', 'docx'].includes(extension)) {
      type = 'application/msword';
    }
    else if (['xls', 'xlsx'].includes(extension)) {
      type = 'application/vnd.ms-excel';
    }
    else if (['ppt', 'pptx'].includes(extension)) {
      type = 'application/vnd.ms-powerpoint';
    }
    else if (extension === 'pdf') {
      type = 'application/pdf';
    }
    else if (extension === 'txt') {
      type = 'text/plain';
    }
    // 音频扩展名
    else if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(extension)) {
      type = `audio/${extension === 'mp3' ? 'mpeg' : extension}`;
    }
    // 视频扩展名
    else if (['mp4', 'webm', 'avi', 'mov', 'flv', 'mkv'].includes(extension)) {
      type = `video/${extension === 'mov' ? 'quicktime' : extension}`;
    }
    // 压缩文件扩展名
    else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      type = 'application/zip';
    }
  }
  
  // 文件夹特殊处理
  if (entity.isFolder) {
    type = 'folder';
  }

  return {
    id: entity.id,
    name: entity.name,
    size: entity.size || 0,
    type: type,
    url: entity.url || '',
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
    parentId: entity.parentId,
    tags: entity.tags,
    isFolder: entity.isFolder,
    path: entity.path || null,
    extension: extension
  };
}

// 为了兼容已有的代码，添加File别名
export type File = FileInfo; 