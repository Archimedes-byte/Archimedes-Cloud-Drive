/**
 * 存储工具函数模块
 * 提供各种辅助功能
 * 
 * 注意：为避免重复代码，部分功能直接从通用工具模块重导出
 */

// 导出下载工具
export * from './download';

// 导出文件类型工具
export * from './storage-utils';

// 从通用工具模块重导出一些重叠的功能
// 这样做是为了保持向后兼容性
export { 
  formatFileSize, 
  getFileIcon as getFileIconFromUtils,
  getFileTypeByExtension 
} from '@/app/utils/file'; 