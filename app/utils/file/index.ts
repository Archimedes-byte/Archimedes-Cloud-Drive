/**
 * 文件工具函数统一导出
 * 
 * 此模块集中了所有与文件处理相关的工具函数，包括：
 * - 文件类型判断
 * - 文件格式化（大小、日期等）
 * - 文件路径处理
 * - 文件排序
 * - 文件转换
 * 
 * 注意：为避免冗余，所有文件处理相关功能应从此模块导入，
 * 而不是直接从子模块或其他位置导入。
 */

// 导出文件类型相关函数
import {
  FILE_CATEGORIES,
  FILE_TYPE_MAPS,
  getFileIcon,
  getFileTypeByExtension,
  getFileType,
  getFileCategory,
  filterFilesByType,
  buildFileTypeFilter,
  generateUniqueFilename,
  sanitizeFilename,
  filterFiles,
  FILE_TYPE_EXTENSIONS,
  getFileExtension,
  getFileNameAndExtension,
  matchesFileType,
  isImageFile,
  isDocumentFile,
  isVideoFile,
  isAudioFile,
  getFileTypeByName
} from './type';

// 直接导出，不进行重命名
export {
  FILE_CATEGORIES,
  FILE_TYPE_MAPS,
  getFileIcon,
  getFileTypeByExtension,
  getFileType,
  getFileCategory,
  filterFilesByType,
  buildFileTypeFilter,
  generateUniqueFilename,
  sanitizeFilename,
  filterFiles,
  FILE_TYPE_EXTENSIONS,
  getFileExtension,
  getFileNameAndExtension,
  matchesFileType,
  isImageFile,
  isDocumentFile,
  isVideoFile,
  isAudioFile,
  getFileTypeByName
};

// 导出文件格式化相关函数，使用formatter.ts中的实现
export {
  formatFileSize,
  formatDate,
  getRelativeTimeString,
  formatFile
} from './formatter';

// 导出文件路径处理函数
export * from './path';

// 导出文件排序函数
export * from './sort';

// 导出文件转换函数
export * from './converter';

// 导出文件图标映射
export * from './icon-map'; 