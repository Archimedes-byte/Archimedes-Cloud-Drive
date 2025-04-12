/**
 * 文件类型系统 - 优化的类型定义
 * 
 * 本文件定义了文件系统中的所有类型，采用清晰的继承链结构
 */

import { BaseEntity } from '../core/common';

/**
 * 文件类型枚举 - 取代字符串联合类型
 */
export enum FileTypeEnum {
  DOCUMENT = 'document',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  ARCHIVE = 'archive',
  PDF = 'pdf',
  CODE = 'code',
  FOLDER = 'folder',
  UNKNOWN = 'unknown'
}

/**
 * 排序方向枚举 - 取代字符串联合类型
 */
export enum SortDirectionEnum {
  ASC = 'asc',
  DESC = 'desc'
}

/**
 * 文件排序枚举 - 取代字符串联合类型
 */
export enum FileSortEnum {
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
  DATE_ASC = 'date_asc',
  DATE_DESC = 'date_desc',
  SIZE_ASC = 'size_asc',
  SIZE_DESC = 'size_desc'
}

// 兼容旧代码的类型别名
export type SortOrder = keyof typeof FileSortEnum;

/**
 * 字段排序类型
 */
export type SortField = 'name' | 'date' | 'size' | 'type' | 'createdAt';

/**
 * 文件排序接口 - 用于组件内部排序状态
 * 与hooks/useFiles.ts中的FileSortInterface兼容
 */
export interface FileSortInterface {
  field: SortField;
  direction: SortDirectionEnum;
}

/**
 * MIME类型类别枚举
 * 更精确地定义常见MIME类型类别
 */
export enum MimeTypeCategory {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  TEXT = 'text',
  APPLICATION = 'application',
  FONT = 'font',
  MODEL = 'model',
  MULTIPART = 'multipart',
  MESSAGE = 'message',
  FOLDER = 'folder'
}

/**
 * 常用文件扩展名联合类型
 * 限制文件扩展名为已知类型，提高类型安全性
 */
export type CommonFileExtension =
  // 文档
  | 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'ppt' | 'pptx' | 'txt' | 'rtf' | 'csv' | 'md'
  // 图片
  | 'jpg' | 'jpeg' | 'png' | 'gif' | 'svg' | 'webp' | 'bmp' | 'ico' | 'tiff' | 'avif'
  // 音频
  | 'mp3' | 'wav' | 'ogg' | 'aac' | 'flac' | 'm4a'
  // 视频
  | 'mp4' | 'avi' | 'mov' | 'wmv' | 'flv' | 'mkv' | 'webm'
  // 压缩
  | 'zip' | 'rar' | '7z' | 'gz' | 'tar' | 'bz2'
  // 编程
  | 'js' | 'ts' | 'jsx' | 'tsx' | 'html' | 'css' | 'scss' | 'json' | 'xml' | 'yaml' | 'py' | 'java' | 'cpp' | 'c' | 'cs' | 'go' | 'php' | 'rb'
  // 其他
  | string;

/**
 * 文件系统项基础接口 - 文件和文件夹的共同基础
 */
export interface FileSystemItemBase extends BaseEntity {
  /** 文件或文件夹名称 */
  name: string;
  /** 文件或文件夹路径 */
  path: string;
  /** 父文件夹ID */
  parentId?: string | null;
  /** 是否为文件夹 */
  isFolder: boolean;
}

/**
 * 文件基础接口 - 文件特有属性
 */
export interface FileBase extends FileSystemItemBase {
  /** 标识为文件 */
  isFolder: false;
  /** 文件大小(字节) */
  size: number;
  /** 文件类型 */
  type: FileTypeEnum | string;
  /** 文件扩展名 */
  extension?: CommonFileExtension;
  /** MIME类型 */
  mimeType?: string;
}

/**
 * 文件夹基础接口 - 文件夹特有属性
 */
export interface FolderBase extends FileSystemItemBase {
  /** 标识为文件夹 */
  isFolder: true;
  /** 文件夹类型 */
  type: 'folder';
  /** 文件夹中的项目数量 */
  itemCount?: number;
}

/**
 * 带元数据的文件接口 - 扩展文件基础接口
 */
export interface FileWithMetadata extends FileBase {
  /** 文件标签 */
  tags?: string[];
  /** 文件元数据 */
  metadata?: Record<string, unknown>;
  /** 文件完整路径 */
  fullPath?: string;
  /** 上传者ID */
  uploaderId?: string;
}

/**
 * 带元数据的文件夹接口 - 扩展文件夹基础接口
 */
export interface FolderWithMetadata extends FolderBase {
  /** 文件夹标签 */
  tags?: string[];
  /** 文件夹元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * UI显示所需的文件接口 - 添加UI状态
 */
export interface FileWithUIState extends FileWithMetadata {
  /** 是否选中 */
  selected?: boolean;
  /** 是否正在上传 */
  uploading?: boolean;
  /** 上传进度(0-100) */
  uploadProgress?: number;
  /** 错误信息 */
  error?: string | null;
  /** 是否已删除 */
  isDeleted?: boolean;
}

/**
 * UI显示所需的文件夹接口 - 添加UI状态
 */
export interface FolderWithUIState extends FolderWithMetadata {
  /** 是否选中 */
  selected?: boolean;
  /** 错误信息 */
  error?: string | null;
  /** 是否已删除 */
  isDeleted?: boolean;
}

/**
 * 文件路径项接口 - 替代废弃的FilePathItem
 */
export interface FolderPathItem {
  /** 文件夹ID */
  id: string;
  /** 文件夹名称 */
  name: string;
}

// 导出类型别名以兼容现有代码
export type FileItem = FileWithUIState;
export type Folder = FolderWithUIState;
export type ExtendedFile = FileWithUIState;

/**
 * 文件信息简化接口 - 用于API请求和简化场景
 */
export interface FileInfo {
  /** 文件ID */
  id: string;
  /** 文件名称 */
  name: string;
  /** 文件类型 */
  type: FileTypeEnum | string;
  /** 文件大小 */
  size?: number;
  /** 文件路径 */
  path?: string;
  /** 文件物理文件名 */
  filename?: string;
  /** 文件扩展名 */
  extension?: CommonFileExtension;
  /** 是否为文件夹 */
  isFolder?: boolean;
  /** 父文件夹ID */
  parentId?: string | null;
  /** 创建时间 */
  createdAt?: string | Date;
  /** 更新时间 */
  updatedAt?: string | Date;
  /** 文件标签 */
  tags?: string[];
  /** 文件URL（如果可访问） */
  url?: string;
}

/**
 * 文件排序选项
 */
export interface FileSortOptions {
  /** 排序字段 */
  field: SortField;
  /** 排序方向 */
  direction: SortDirectionEnum;
}

/**
 * 排序工具函数 - 将FileSortInterface转换为SortOrder
 */
export function convertInterfaceToSortOrder(sortInterface: FileSortInterface): SortOrder {
  const { field, direction } = sortInterface;
  
  if (field === 'name') {
    return direction === SortDirectionEnum.ASC ? 'NAME_ASC' : 'NAME_DESC';
  } else if (field === 'size') {
    return direction === SortDirectionEnum.ASC ? 'SIZE_ASC' : 'SIZE_DESC';
  } else if (field === 'createdAt' || field === 'date') {
    return direction === SortDirectionEnum.ASC ? 'DATE_ASC' : 'DATE_DESC';
  } else if (field === 'type') {
    // 暂时没有对应的类型排序，使用名称排序作为降级处理
    return direction === SortDirectionEnum.ASC ? 'NAME_ASC' : 'NAME_DESC';
  }
  
  // 默认返回按日期降序
  return 'DATE_DESC';
}

/**
 * 排序工具函数 - 将SortOrder转换为FileSortInterface
 */
export function convertSortOrderToInterface(sortOrder: SortOrder): FileSortInterface {
  switch(sortOrder) {
    case 'NAME_ASC':
      return { field: 'name', direction: SortDirectionEnum.ASC };
    case 'NAME_DESC':
      return { field: 'name', direction: SortDirectionEnum.DESC };
    case 'DATE_ASC':
      return { field: 'createdAt', direction: SortDirectionEnum.ASC };
    case 'DATE_DESC':
      return { field: 'createdAt', direction: SortDirectionEnum.DESC };
    case 'SIZE_ASC':
      return { field: 'size', direction: SortDirectionEnum.ASC };
    case 'SIZE_DESC':
      return { field: 'size', direction: SortDirectionEnum.DESC };
    default:
      return { field: 'createdAt', direction: SortDirectionEnum.DESC };
  }
}

/**
 * 文件树节点接口 - 用于层级文件结构展示
 */
export interface FileTreeNode {
  /** 节点名称 */
  name: string;
  /** 节点类型：文件或文件夹 */
  type: 'file' | 'folder';
  /** 文件大小（字节） */
  size: number;
  /** 子节点列表 */
  children?: FileTreeNode[];
  /** 原始File对象（用于上传） */
  file?: globalThis.File & { webkitRelativePath?: string };
}

/**
 * 数据库文件实体接口 - 用于Prisma返回的文件数据
 */
export interface FileEntity {
  id: string;
  name: string;
  filename?: string;
  type: string | null;
  size: number | null;
  path: string;
  url: string | null;
  isFolder: boolean;
  parentId: string | null;
  uploaderId: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted?: boolean;
  tags?: string[];
}

/**
 * 文件API响应类型 - 上传和文件操作API返回的文件信息
 */
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

/**
 * 创建文件夹请求接口
 */
export interface CreateFolderRequest {
  name: string;
  parentId?: string | null;
  tags?: string[];
}

/**
 * 将数据库文件实体映射为文件信息对象
 * 用于API响应
 */
export function mapFileEntityToFileInfo(entity: FileEntity): FileInfo {
  return {
    id: entity.id,
    name: entity.name,
    filename: entity.filename,
    type: entity.type || '',
    size: entity.size || 0,
    path: entity.path,
    isFolder: entity.isFolder,
    parentId: entity.parentId,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    tags: entity.tags || [],
    url: entity.url || undefined,
    extension: entity.name.split('.').pop() as CommonFileExtension
  };
}

/**
 * MIME类型与文件类型的映射 
 * 用于文件类型识别与分类
 */
export const FILE_TYPE_MAP: Record<string, { mimeTypes: string[]; extensions: string[] }> = {
  [FileTypeEnum.IMAGE]: {
    mimeTypes: ['image'],
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'avif']
  },
  [FileTypeEnum.DOCUMENT]: {
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
  [FileTypeEnum.VIDEO]: {
    mimeTypes: ['video'],
    extensions: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm']
  },
  [FileTypeEnum.AUDIO]: {
    mimeTypes: ['audio'],
    extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac']
  },
  [FileTypeEnum.ARCHIVE]: {
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
    extensions: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2']
  },
  [FileTypeEnum.PDF]: {
    mimeTypes: ['application/pdf'],
    extensions: ['pdf']
  },
  [FileTypeEnum.CODE]: {
    mimeTypes: ['text/plain', 'text/html', 'text/css', 'application/javascript', 'text/javascript'],
    extensions: ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'json', 'xml', 'yaml', 'py', 'java', 'cpp', 'c', 'cs', 'go', 'php', 'rb']
  },
  [FileTypeEnum.FOLDER]: {
    mimeTypes: ['folder'],
    extensions: []
  },
  [FileTypeEnum.UNKNOWN]: {
    mimeTypes: [],
    extensions: []
  }
}; 