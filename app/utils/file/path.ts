/**
 * 文件路径工具函数集合
 * 处理文件名、扩展名、路径等操作
 */

import path from 'path';

/**
 * 获取文件所在目录路径
 * @param path 文件完整路径
 * @returns 文件所在目录路径
 */
export const getFilePath = (filePath: string | undefined) => {
  if (!filePath) return '/';
  const parts = filePath.split('/');
  return parts.slice(0, -1).join('/') || '/';
};

/**
 * 获取文件扩展名(不带点)
 * @param filename 文件名
 * @returns 文件扩展名
 */
export const getExtension = (filename: string): string => {
  return path.extname(filename).substring(1).toLowerCase();
};

/**
 * 获取不带扩展名的文件名
 * @param filename 文件名
 * @returns 不带扩展名的文件名
 */
export const getBaseName = (filename: string): string => {
  // 使用type.ts中定义的函数
  // 这里需要直接获取文件名部分
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return filename;
  }
  return filename.substring(0, lastDotIndex);
};

/**
 * 合并路径片段
 * @param segments 路径片段数组
 * @returns 合并后的规范化路径
 */
export const joinPath = (...segments: string[]): string => {
  // 使用path.join并替换反斜杠为正斜杠，保持URL路径风格一致
  return path.join(...segments).replace(/\\/g, '/');
};

/**
 * 规范化路径，确保以/开头
 * @param filePath 文件路径
 * @returns 规范化的路径
 */
export const normalizePath = (filePath: string): string => {
  if (!filePath) return '/';
  
  const normalized = filePath.replace(/\\/g, '/');
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
};

/**
 * 检查是否是有效的文件路径
 * @param filePath 文件路径
 * @returns 是否有效
 */
export const isValidPath = (filePath: string | undefined): boolean => {
  if (!filePath) return false;
  
  // 检查是否包含非法字符
  const invalidCharsRegex = /[<>:"\\|?*\x00-\x1F]/g;
  return !invalidCharsRegex.test(filePath);
};

/**
 * 构建文件URL路径
 * @param baseUrl 基础URL
 * @param filename 文件名
 * @returns 完整的文件URL
 */
export const buildFileUrl = (baseUrl: string, filename: string): string => {
  return joinPath(baseUrl, filename);
};

/**
 * 从完整路径中获取文件名
 * @param fullPath 完整路径
 * @returns 文件名
 */
export const getFilenameFromPath = (fullPath: string): string => {
  return path.basename(fullPath);
};

// 废弃的sortPathFiles函数已删除，请使用sort.ts中的sortFiles函数
