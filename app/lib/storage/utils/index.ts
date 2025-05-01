/**
 * 存储工具函数模块
 * 提供各种辅助功能
 * 
 * 注意：为避免重复代码，文件处理通用功能从 @/app/utils/file 导入
 * 此模块只包含存储特定的功能
 */

// 导出下载工具
export * from './download';

// 从统一的文件工具模块重导出常用函数
// 这仅为了向后兼容，新代码应直接从 @/app/utils/file 导入
import { 
  getFileIcon,
  formatFileSize,
  getFileExtension 
} from '@/app/utils/file';

export {
  getFileIcon,
  formatFileSize,
  getFileExtension
};

// 导出存储特定工具，只包含存储模块特有的功能
export * from './storage-utils'; 