/**
 * 文件类型定义
 * 
 * 提供统一的文件类型枚举和类型定义
 */

/**
 * 文件类型枚举
 * 用于统一系统中文件类型的表示
 */
export enum FileType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio',
  ARCHIVE = 'archive',
  CODE = 'code',
  FOLDER = 'folder',
  UNKNOWN = 'unknown'
}

/**
 * 文件基础属性接口
 */
export interface FileBase {
  id?: string;
  name: string;
  size?: number;
  type?: string;
  extension?: string;
  path?: string;
  url?: string;
  isFolder: boolean;
  lastModified?: Date | string;
  createdAt?: Date | string;
}

/**
 * 文件排序字段类型
 */
export type FileSortField = 'name' | 'size' | 'lastModified' | 'type';

/**
 * 文件排序方向
 */
export type SortDirection = 'asc' | 'desc';

/**
 * 文件排序选项
 */
export interface FileSortOptions {
  field: FileSortField;
  direction: SortDirection;
}

/**
 * 文件过滤选项
 */
export interface FileFilterOptions {
  fileType?: FileType | null;
  searchTerm?: string;
  includeFolder?: boolean;
}

/**
 * 文件操作结果
 */
export interface FileOperationResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: Error;
} 