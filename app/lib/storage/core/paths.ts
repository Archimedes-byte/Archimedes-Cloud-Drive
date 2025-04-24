/**
 * 文件路径工具 (File Paths Utilities)
 * 
 * 此模块提供文件路径、存储位置和URL生成相关的工具函数。
 * 主要功能：
 * - 存储路径管理
 * - 唯一文件名生成
 * - 文件URL生成
 */

import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { STORAGE_CONFIG } from '@/app/lib/config';

/**
 * 获取存储路径
 *
 * @param userId - 用户ID
 * @param folderPath - 可选的文件夹路径
 * @returns 完整的存储路径
 */
export function getStoragePath(userId: string, folderPath?: string): string {
  const basePath = STORAGE_CONFIG.UPLOAD_PATH;
  const userPath = path.join(basePath, userId);
  
  if (folderPath) {
    return path.join(userPath, folderPath);
  }
  
  return userPath;
}

/**
 * 生成唯一文件名
 *
 * @param originalFilename - 原始文件名
 * @returns 唯一文件名
 */
export function generateUniqueFilename(originalFilename: string): string {
  const ext = path.extname(originalFilename);
  const basename = path.basename(originalFilename, ext);
  const uniqueId = uuidv4();
  
  // 使用原始文件名和UUID组合生成唯一文件名
  return `${basename}-${uniqueId}${ext}`;
}

/**
 * 生成文件URL
 *
 * @param fileId - 文件ID
 * @param filename - 可选的文件名（用于下载）
 * @returns 用于访问文件的URL
 */
export function generateFileUrl(fileId: string, filename?: string): string {
  const baseUrl = STORAGE_CONFIG.FILE_BASE_URL;
  
  if (filename) {
    const encodedFilename = encodeURIComponent(filename);
    return `${baseUrl}/${fileId}/content?filename=${encodedFilename}`;
  }
  
  return `${baseUrl}/${fileId}/content`;
} 