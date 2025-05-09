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

// 从lib移动的功能
import { message } from 'antd';
import { FolderPathItem } from '@/app/types';
import { API_PATHS } from '@/app/lib/api/paths';
import { handleError, safeAsync } from '@/app/utils/error';

/**
 * 加载文件夹路径
 * @param folderId 文件夹ID
 * @returns 文件夹路径或null
 */
export const loadFolderPathHelper = async (
  folderId: string | null
): Promise<FolderPathItem[] | null> => {
  // 如果是根文件夹，直接返回空数组
  if (!folderId) {
    return [];
  }

  try {
    // 构造路径API
    const folderPath = `/api/storage/folders/${folderId}`;
    const response = await fetch(`${folderPath}/path`);
    
    // 检查内容类型
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    if (!response.ok) {
      if (isJson) {
        const errorData = await response.json();
        throw new Error(errorData.error || `加载文件夹路径失败: ${response.status}`);
      } else {
        throw new Error(`加载文件夹路径失败: ${response.status} ${response.statusText}`);
      }
    }
    
    // 确保响应是JSON格式
    if (!isJson) {
      console.error('服务器返回了非JSON格式的响应:', contentType);
      throw new Error('服务器返回了非JSON格式的响应');
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log('加载文件夹路径成功:', data.path);
      return data.path || [];
    } else {
      console.error('加载文件夹路径失败:', data.error);
      throw new Error(data.error || '加载文件夹路径失败');
    }
  } catch (error) {
    console.error('获取文件夹路径错误:', error);
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