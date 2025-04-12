/**
 * 文件处理工具函数 (File Handling Utilities)
 * 
 * 提供库内部使用的文件处理工具函数，用于文件类型检测、文件大小计算和文件名处理等。
 */

import path from 'path';

// 文件类型映射
const FILE_TYPE_MAP: Record<string, string> = {
  '.jpg': 'image',
  '.jpeg': 'image',
  '.png': 'image',
  '.gif': 'image',
  '.webp': 'image',
  '.pdf': 'document',
  '.doc': 'document',
  '.docx': 'document',
  '.xls': 'document',
  '.xlsx': 'document',
  '.ppt': 'document',
  '.pptx': 'document',
  '.txt': 'document',
  '.md': 'document',
  '.mp3': 'audio',
  '.mp4': 'video',
  '.mov': 'video',
  '.avi': 'video',
  '.zip': 'archive',
  '.rar': 'archive',
  '.7z': 'archive'
};

/**
 * 获取文件大小的可读字符串
 * 
 * @param size - 文件大小（字节数）
 * @returns 格式化后的文件大小字符串（如：1.5MB）
 */
export function getFileSize(size: number): string {
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)}MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)}GB`;
}

/**
 * 根据文件扩展名获取文件类型
 * 
 * @param fileName - 文件名
 * @returns 文件类型（如：image, document, video等）
 */
export function getFileType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  return FILE_TYPE_MAP[ext] || 'other';
}

/**
 * 检查文件是否为图片
 * 
 * @param fileName - 文件名
 * @returns 是否为图片类型
 */
export function isImage(fileName: string): boolean {
  return getFileType(fileName) === 'image';
}

/**
 * 检查文件是否为文档
 * 
 * @param fileName - 文件名
 * @returns 是否为文档类型
 */
export function isDocument(fileName: string): boolean {
  return getFileType(fileName) === 'document';
}

/**
 * 清理文件名，移除不安全字符
 * 
 * @param fileName - 原始文件名
 * @returns 清理后的安全文件名
 */
export function sanitizeFileName(fileName: string): string {
  // 移除路径分隔符和控制字符
  let sanitized = fileName.replace(/[/\\?%*:|"<>]/g, '-');
  
  // 限制文件名长度
  if (sanitized.length > 200) {
    const ext = path.extname(sanitized);
    const name = sanitized.slice(0, 200 - ext.length);
    sanitized = name + ext;
  }
  
  return sanitized;
} 