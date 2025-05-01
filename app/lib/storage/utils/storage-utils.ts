/**
 * 存储特定工具函数
 * 提供存储系统特有的功能
 * 
 * 注意：通用文件处理函数已移至 @/app/utils/file
 */

import { getFileExtension } from '@/app/utils/file';

/**
 * 存储相关常量
 * 这些常量仅在存储模块内使用
 */
export const STORAGE_CONSTANTS = {
  MAX_UPLOAD_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_UPLOAD_TYPES: '*', // 允许所有类型
  DEFAULT_CHUNK_SIZE: 5 * 1024 * 1024, // 5MB
};

/**
 * 检查文件是否可上传
 * @param file 文件对象
 * @returns 是否可上传及错误信息
 */
export function validateUploadFile(file: File): { valid: boolean; message?: string } {
  // 检查文件大小
  if (file.size > STORAGE_CONSTANTS.MAX_UPLOAD_SIZE) {
    return {
      valid: false,
      message: `文件大小不能超过${STORAGE_CONSTANTS.MAX_UPLOAD_SIZE / 1024 / 1024}MB`
    };
  }
  
  // 如果有特定限制，检查文件类型
  if (STORAGE_CONSTANTS.ALLOWED_UPLOAD_TYPES !== '*') {
    const extension = getFileExtension(file.name).toLowerCase();
    const allowedTypes = STORAGE_CONSTANTS.ALLOWED_UPLOAD_TYPES.split(',');
    if (!allowedTypes.includes(extension)) {
      return {
        valid: false,
        message: `不支持的文件类型: ${extension}`
      };
    }
  }
  
  return { valid: true };
}

/**
 * 为存储路径添加前缀
 * @param path 原始路径
 * @returns 带前缀的路径
 */
export function addStoragePrefix(path: string): string {
  // 移除开头的斜杠
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `storage/${cleanPath}`;
}

/**
 * 从存储路径中移除前缀
 * @param path 存储路径
 * @returns 无前缀的路径
 */
export function removeStoragePrefix(path: string): string {
  const prefix = 'storage/';
  if (path.startsWith(prefix)) {
    return path.substring(prefix.length);
  }
  return path;
} 