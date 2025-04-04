/**
 * 导入修复工具
 * 
 * 这个文件解决项目中导入路径不一致的问题
 * 使得 @/lib/* 和 @/app/lib/* 导入路径都能正常工作
 */

// 重新导出认证相关内容
export * from './auth';

// 重新导出Prisma客户端
export * from './prisma';

// 重新导出工具函数
export * from './utils';

// 重新导出文件工具函数
export * from './file/utils';

// 带名称重新导出存储相关函数，避免命名冲突
export { 
  saveFile as saveFileStorage,
  getFile as getFileStorage,
  deleteFile as deleteFileStorage
} from './storage';

// 带名称重新导出文件服务相关函数，避免命名冲突
export { 
  saveFile as saveFileService,
  getFile as getFileService,
  deleteFile as deleteFileService
} from './fileService'; 