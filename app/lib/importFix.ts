/**
 * 导入路径修复
 * 
 * 这个文件用于帮助解决导入路径问题，确保从@/lib导入的模块能够正确地重定向到@/app/lib
 */

// 导出核心功能
export * from './auth';
export * from './prisma';

// 导出文件服务功能
export { 
  saveFile as saveFileService,
  deleteFile as deleteFileService,
  getFile as getFileService
} from './fileService';

// 导出存储功能
export { 
  saveFile as saveFileToStorage,
  getFile as getFileFromStorage,
  deleteFile as deleteFileFromStorage
} from './storage';

// 导出工具函数
export * from './utils';

// 导出配置
export * from './config'; 