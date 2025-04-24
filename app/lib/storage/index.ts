/**
 * 存储模块
 * 
 * 提供文件存储、访问和管理的功能
 * 包括：
 * - 文件上传和下载
 * - 文件读写操作
 * - 存储路径管理
 * - 访问权限控制
 */

// 导出核心功能中的指定函数，避免命名冲突
export { 
  // 从存储核心导出特定函数
  getStoragePath, 
  generateUniqueFilename, 
  generateFileUrl,
  validateFileAccess
} from './core';

// 导出文件处理功能
export * from './file-handling';

// 导出服务层功能（仅用于内部服务端操作）
// 这些函数以Service后缀命名，以区分于直接存储操作
export { 
  saveFile as saveFileService,
  getFile as getFileService,
  deleteFile as deleteFileService
} from './service/fileService';

// 导出工具函数，避免命名冲突
export {
  getFileIcon,
  formatFileSize,
  getFileNameAndExtension,
  TYPE_MAP,
  FILE_TYPE_MAP
} from './utils';

// 导出类型定义
export type { FileType } from './utils';

// 导出存储基础操作，这些是主要的API
export {
  saveFile,
  getFile,
  deleteFile
} from './core/storage';

// 导出下载工具函数（从utils/storage导入）
export {
  downloadFile,
  downloadFolder
} from '@/app/utils/storage/download';

// 注意：上面导出的模块已经包含了所有功能，不再需要单独导出
// 以下导出已被弃用，仅为保持向后兼容性 