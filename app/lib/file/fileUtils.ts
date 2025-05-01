import { message } from 'antd';
import { FolderPathItem } from '@/app/types';
import { API_PATHS } from '@/app/lib/api/paths';
import { handleError, createFileError, ErrorType, safeAsync } from '@/app/utils/error';

/**
 * 通用文件操作工具函数
 * 提取自各个hooks中的重复功能
 */

// 文件下载功能已全部移至 @/app/lib/storage/utils/download
// 请使用 import { downloadFile, downloadFolder } from '@/app/lib/storage/utils/download'

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