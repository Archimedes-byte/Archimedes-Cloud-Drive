/**
 * 存储模块
 * 
 * 提供文件存储、访问和管理的底层功能
 * 
 * lib层职责：
 * - 提供与业务无关的底层功能
 * - 实现基础的文件操作和存储管理
 * - 提供通用工具函数
 * - 不直接实现业务逻辑
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

// 导出文件工具函数 
export {
  loadFolderPath,
  copyToClipboard,
  getFileExtension,
  getFileNameAndExtension,
  isImageFile,
  sanitizeFilename
} from './utils/file-utils';

// 从文件工具模块导入相关类型和函数
import { FileType } from '@/app/types/file';
import { FILE_TYPE_MAP } from '@/app/types/domains/fileTypes';

// 重新导出这些导入的类型和函数
export { FileType, FILE_TYPE_MAP };

// 导出存储基础操作，这些是主要的API
export {
  saveFile,
  getFile,
  deleteFile
} from './core/storage';

// 导出下载工具函数
export {
  downloadFile,
  downloadFolder,
  downloadBlob,
  getFileBlob
} from './utils/download';

// 注意：不再从app/services/storage导入高级服务
// 避免循环依赖问题
// 使用方应直接从app/services/storage导入所需服务 