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

// 导出工具函数，避免命名冲突
export {
  getFileIcon,
  formatFileSize
} from './utils';

// 从文件工具模块导入相关类型和函数
import { getFileNameAndExtension } from '@/app/utils/file';
import { FileType } from '@/app/types';
import { FILE_TYPE_MAP } from '@/app/types/domains/fileTypes';

// 重新导出这些导入的类型和函数
export { getFileNameAndExtension, FileType, FILE_TYPE_MAP };

// 导出存储基础操作，这些是主要的API
export {
  saveFile,
  getFile,
  deleteFile
} from './core/storage';

// 导出下载工具函数（直接从utils/中导入，解决循环依赖）
export {
  downloadFile,
  downloadFolder,
  downloadBlob,
  downloadFileDirect,
  downloadMultipleFiles
} from './utils/download';

// 从app/services/storage导入高级服务 (推荐使用这些服务)
import { 
  FileUploadService, 
  FileManagementService, 
  FileStatsService,
  FavoriteService 
} from '@/app/services/storage';

// 重导出高级服务
export {
  FileUploadService, 
  FileManagementService, 
  FileStatsService,
  FavoriteService
}; 