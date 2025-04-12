/**
 * 工具函数模块 (Utilities Module)
 * 
 * 此模块提供核心库使用的工具函数集合。
 * 注意：此模块中提供的工具函数仅供lib内部使用，
 * 应用级别的通用工具函数应当从app/utils导入。
 * 
 * 主要功能：
 * - 错误处理与格式化
 * - 文件操作工具
 * - 数据转换与验证
 */

// 导出核心错误处理工具
export {
  createError,
  formatError,
  isLibError
} from './error';

// 导出文件处理工具
export {
  getFileSize,
  getFileType,
  isImage,
  isDocument,
  sanitizeFileName
} from './file';

// 附加其他lib内部使用的工具函数
export const libUtils = {
  // 可以在这里添加其他lib专用工具函数
}; 