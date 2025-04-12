/**
 * 文件相关类型定义
 * 
 * 包含文件的基本数据结构和操作相关的类型定义
 */

import { BaseEntity } from '../core/common';

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

// 排序顺序
export interface SortOrder {
  field: string;
  direction: 'asc' | 'desc';
}

// 文件树节点接口
export interface FileTreeNode {
  name: string;
  type: 'file' | 'folder';
  size: number;
  children?: FileTreeNode[];
  file?: globalThis.File & { webkitRelativePath?: string };
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
  if (entity.name && !entity.isFolder) {
    const parts = entity.name.split('.');
    if (parts.length > 1) {
      extension = parts[parts.length - 1].toLowerCase();
    }
  }

  return {
    id: entity.id,
    name: entity.name,
    size: entity.size || 0,
    type: entity.type || '',
    isFolder: entity.isFolder,
    parentId: entity.parentId,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
    url: entity.url || '',
    tags: entity.tags,
    path: entity.path,
    extension
  };
}

// 类型别名 - 兼容旧代码
export type File = FileInfo; 