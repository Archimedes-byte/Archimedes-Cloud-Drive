/**
 * 文件管理相关功能导出
 * 
 * 提供文件路径处理、访问控制等功能
 */

// 导出路径处理功能
export * from './paths';

// 导出访问控制功能
export * from './validateFileAccess';

// 导出工具函数
export * from './utils';

// 导出文件服务功能，使用别名避免冲突
export { 
  saveFile as saveFileInLib,
  getFile as getFileInLib,
  deleteFile as deleteFileInLib
} from './storage'; 