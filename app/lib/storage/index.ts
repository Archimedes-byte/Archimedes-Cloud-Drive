/**
 * 存储相关功能导出
 * 
 * 提供文件存储和管理功能
 */

// 导出存储基本功能，使用别名避免冲突
export { 
  saveFile as saveFileToStorage,
  getFile as getFileFromStorage,
  deleteFile as deleteFileFromStorage
} from './storage';

// 导出预签名URL功能
export * from './getSignedUrl';

// 导出文件服务
export { 
  saveFile as saveFileService,
  getFile as getFileService,
  deleteFile as deleteFileService
} from './service/fileService'; 