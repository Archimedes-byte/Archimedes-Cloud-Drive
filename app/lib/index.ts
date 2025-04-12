/**
 * 库功能集中导出
 * 
 * 提供应用核心功能的集中访问点
 */

// 导出认证相关功能，使用具体路径避免错误
import * as auth from './auth/index';
export { auth };

// 导出数据库相关功能
import * as database from './database/index';
export { database };

// 导出配置相关功能
import * as config from './config/index';
export { config };

// 文件和存储导出使用别名避免冲突
import * as fileLib from './file/index';
import * as storageLib from './storage/index';

// 重新导出文件相关功能
export { fileLib };

// 重新导出存储相关功能
export { storageLib };

// 保持向后兼容的导出
import { 
  saveFileService, 
  getFileService, 
  deleteFileService,
  saveFileToStorage,
  getFileFromStorage,
  deleteFileFromStorage 
} from './storage/index';

export { 
  saveFileService, 
  getFileService, 
  deleteFileService,
  saveFileToStorage,
  getFileFromStorage,
  deleteFileFromStorage 
};

// 导出工具函数（重定向到app/utils）
export * from './utils'; 