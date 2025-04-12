/**
 * 导入路径修复
 * 
 * 这个文件用于帮助解决导入路径问题，确保从@/lib导入的模块能够正确地重定向到@/app/lib
 */

// 导出核心功能
export * from './auth/index';
export * from './database/prisma';

// 导出文件服务功能
export { 
  saveFileService,
  deleteFileService,
  getFileService
} from './storage/index';

// 导出存储功能
export { 
  saveFileToStorage,
  getFileFromStorage,
  deleteFileFromStorage
} from './storage/index';

// 导出工具函数
export * from './utils';

// 导出配置
export * from './config/index'; 