/**
 * 文件操作通用工具函数
 * 提供与文件处理相关的基础功能
 */
import { message } from 'antd';
import { FolderPathItem } from '@/app/types';
import { API_PATHS } from '@/app/lib/api/paths';
import { handleError, createFileError, handleApiResponse } from '@/app/utils/error';

// 文件夹路径响应类型
interface FolderPathResponse {
  success: boolean;
  path: FolderPathItem[];
  error?: string;
}

/**
 * 加载文件夹路径
 * @param folderId 文件夹ID
 * @returns 文件夹路径或null
 */
export const loadFolderPath = async (
  folderId: string | null
): Promise<FolderPathItem[] | null> => {
  // 如果是根文件夹，直接返回空数组
  if (!folderId) {
    return [];
  }

  try {
    console.log(`[文件工具] 加载文件夹路径: ${folderId}`);
    
    // 构造路径API
    const folderPath = `/api/storage/folders/${folderId}`;
    const response = await fetch(`${folderPath}/path`);
    
    // 使用统一的API响应处理
    const data = await handleApiResponse<FolderPathResponse>(response, '加载文件夹路径失败');
    
    console.log('[文件工具] 加载文件夹路径成功:', data.path);
    return data.path || [];
  } catch (error) {
    console.error('[文件工具] 获取文件夹路径错误:', error);
    // 在此处不显示错误提示，调用方决定
    return null;
  }
};

/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 * @param successMessage 成功消息
 * @returns 是否复制成功
 */
export const copyToClipboard = async (
  text: string,
  successMessage: string = '已复制到剪贴板'
): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    message.success(successMessage);
    return true;
  } catch (error) {
    handleError(error, true, 'error', '复制到剪贴板失败');
    return false;
  }
};

/**
 * 格式化文件大小
 * @param bytes 文件大小（字节）
 * @param decimals 小数位数
 * @returns 格式化后的文件大小字符串
 */
export const formatFileSize = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * 获取文件扩展名
 * @param filename 文件名
 * @returns 文件扩展名（小写，不含点）
 */
export const getFileExtension = (filename: string): string => {
  if (!filename) return '';
  
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === 0) return '';
  
  return filename.slice(lastDotIndex + 1).toLowerCase();
};

/**
 * 获取文件名和扩展名
 * @param filename 完整文件名
 * @returns 包含文件名和扩展名的对象
 */
export const getFileNameAndExtension = (filename: string): { name: string; extension: string } => {
  if (!filename) return { name: '', extension: '' };
  
  const lastDotIndex = filename.lastIndexOf('.');
  
  // 如果没有点，或者点在第一个位置，认为没有扩展名
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return { name: filename, extension: '' };
  }
  
  const name = filename.slice(0, lastDotIndex);
  const extension = filename.slice(lastDotIndex + 1).toLowerCase();
  
  return { name, extension };
};

/**
 * 检查是否为图片文件
 * @param filename 文件名
 * @returns 是否为图片
 */
export const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'tif'];
  const extension = getFileExtension(filename);
  return imageExtensions.includes(extension);
};

/**
 * 生成唯一文件名
 * @param originalName 原始文件名
 * @returns 带有唯一标识的文件名
 */
export const generateUniqueFilename = (originalName: string): string => {
  const { name, extension } = getFileNameAndExtension(originalName);
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  
  return extension 
    ? `${name}_${timestamp}_${random}.${extension}`
    : `${name}_${timestamp}_${random}`;
};

/**
 * 安全的文件名（移除不安全字符）
 * @param filename 原始文件名
 * @returns 安全的文件名
 */
export const sanitizeFilename = (filename: string): string => {
  // 移除不安全的字符
  return filename
    .replace(/[<>:"/\\|?*]/g, '_') // 替换Windows不允许的字符
    .replace(/\.\./g, '_') // 替换连续的点
    .replace(/\s+/g, ' ') // 连续空白字符替换为单个空格
    .trim();
}; 