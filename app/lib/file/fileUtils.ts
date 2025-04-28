import { message } from 'antd';
import { FolderPathItem } from '@/app/types';
import { API_PATHS } from '@/app/lib/api/paths';

/**
 * 通用文件操作工具函数
 * 提取自各个hooks中的重复功能
 */

/**
 * 异常处理工具函数
 * @param error 捕获的错误
 * @param defaultMessage 默认错误消息
 * @param showMessage 是否显示消息提示
 * @returns 格式化的错误消息
 */
export const handleApiError = (
  error: unknown, 
  defaultMessage: string = '操作失败，请重试', 
  showMessage: boolean = true
): string => {
  // 详细记录错误
  console.error('API请求失败:', error);
  
  // 提取错误消息
  let errorMessage = defaultMessage;
  if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = (error as Error).message || defaultMessage;
  }
  
  // 显示错误消息
  if (showMessage) {
    message.error(errorMessage);
  }
  
  return errorMessage;
};

/**
 * 下载文件工具函数
 * @param url 下载URL或blob链接
 * @param fileName 文件名
 * @param contentType 内容类型
 * @param blob 可选Blob对象，如果提供则使用此blob而不是从URL获取
 */
export const downloadFileHelper = async (
  url: string,
  fileName: string,
  contentType: string = 'application/octet-stream',
  blob?: Blob
): Promise<boolean> => {
  try {
    // 显示下载中消息
    message.loading({ content: '准备下载文件...', key: 'fileDownload' });
    
    // 如果没有提供blob，从URL获取
    if (!blob && url.startsWith('http')) {
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
      });
      
      if (!response.ok) {
        throw new Error(`下载失败，状态码: ${response.status}`);
      }
      
      blob = await response.blob();
      
      // 如果filename为空，尝试从Content-Disposition获取
      if (!fileName) {
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+?)"?(?:;|$)/);
          if (filenameMatch && filenameMatch[1]) {
            fileName = decodeURIComponent(filenameMatch[1]);
          }
        }
      }
      
      // 如果contentType为空，从响应头获取
      if (!contentType || contentType === 'application/octet-stream') {
        contentType = response.headers.get('Content-Type') || contentType;
      }
    }
    
    // 如果没有blob，说明下载失败
    if (!blob) {
      throw new Error('获取文件内容失败');
    }
    
    // 创建下载链接
    const blobUrl = blob instanceof Blob ? 
      URL.createObjectURL(new Blob([blob], { type: contentType })) : 
      url;
      
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.style.display = 'none';
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    
    // 清理
    setTimeout(() => {
      try {
        document.body.removeChild(link);
        if (blob instanceof Blob) {
          URL.revokeObjectURL(blobUrl);
        }
      } catch (e) {
        // 忽略清理错误
      }
    }, 1000);
    
    message.success({ content: '下载成功', key: 'fileDownload' });
    return true;
  } catch (error) {
    handleApiError(error, '下载文件失败', true);
    return false;
  }
};

/**
 * 下载文件夹工具函数
 * @param folderId 文件夹ID
 * @param folderName 文件夹名称
 * @returns 是否下载成功
 */
export const downloadFolderHelper = async (
  folderId: string, 
  folderName: string
): Promise<boolean> => {
  try {
    message.loading({ content: '准备下载文件夹...', key: 'folderDownload' });
    
    // 构造下载URL，使用正确的API路径
    const downloadUrl = `${API_PATHS.STORAGE.ROOT}/folders/${folderId}/download?_t=${Date.now()}`;
    
    // 使用主下载函数
    const result = await downloadFileHelper(
      downloadUrl,
      `${folderName}.zip`,
      'application/zip'
    );
    
    if (result) {
      message.success({ content: '文件夹下载成功', key: 'folderDownload' });
    } else {
      message.error({ content: '文件夹下载失败', key: 'folderDownload' });
    }
    
    return result;
  } catch (error) {
    handleApiError(error, '下载文件夹失败', true);
    return false;
  }
};

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
    handleApiError(error, '复制到剪贴板失败', true);
    return false;
  }
}; 