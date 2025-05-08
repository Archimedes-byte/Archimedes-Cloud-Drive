/**
 * 存储下载工具函数
 * 提供文件和文件夹下载相关的功能
 */
import { API_PATHS } from '@/app/lib/api/paths';
import { message } from 'antd';
import { fileApi } from '@/app/lib/api/file-api';

// 最大重试次数
const MAX_RETRY_COUNT = 3;
// 重试延迟（指数退避）
const RETRY_BASE_DELAY = 1000;

/**
 * 直接下载Blob
 * 处理已获取的Blob对象，创建下载链接并触发下载
 * 
 * @param blob 要下载的Blob对象
 * @param fileName 文件名
 * @param contentType 内容类型 (可选，默认使用blob的类型)
 * @returns 是否下载成功
 */
export async function downloadBlob(
  blob: Blob, 
  fileName: string = '下载文件',
  contentType?: string
): Promise<boolean> {
  try {
    // 确保内容类型正确
    const finalContentType = contentType || blob.type || 'application/octet-stream';
    
    // 创建带正确内容类型的新Blob
    const finalBlob = new Blob([blob], { type: finalContentType });
    
    // 创建下载链接
    const blobUrl = URL.createObjectURL(finalBlob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.style.display = 'none';
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    
    // 延迟清理，确保浏览器有足够时间处理下载
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 清理
    try {
      document.body.removeChild(link);
    } catch (e) {
      // 忽略移除链接时的错误
    }
    
    // 释放URL对象
    URL.revokeObjectURL(blobUrl);
    
    return true;
  } catch (error) {
    console.error('下载Blob失败:', error);
    message.error('下载文件失败');
    return false;
  }
}

/**
 * 下载文件夹
 * 处理文件夹的ZIP打包下载
 * 
 * @param folderId 文件夹ID
 * @param fileName 可选的自定义文件名
 * @returns 是否下载成功
 */
export async function downloadFolder(folderId: string, fileName?: string): Promise<boolean> {
  try {
    // 获取下载URL
    const downloadUrl = `${API_PATHS.STORAGE.FILES.DOWNLOAD}?t=${Date.now()}`;
    
    // 发送POST请求
    const response = await fetch(downloadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify({ 
        fileIds: [folderId],
        isFolder: true 
      }),
      credentials: 'include'
    });

    if (!response || !response.ok) {
      throw new Error(`文件夹下载请求失败: ${response?.status || 'Failed to fetch'}`);
    }
    
    // 获取文件名
    let downloadFileName = fileName;
    if (!downloadFileName) {
      // 尝试从Content-Disposition头获取文件名
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const matches = /filename="?([^"]*)"?/i.exec(contentDisposition);
        if (matches && matches[1]) {
          downloadFileName = decodeURIComponent(matches[1]);
        }
      }
      
      // 如果还是没有文件名，使用默认名称
      if (!downloadFileName) {
        downloadFileName = '下载文件夹';
      }
    }
    
    // 确保文件名有zip扩展名
    if (!downloadFileName.toLowerCase().endsWith('.zip')) {
      downloadFileName += '.zip';
    }
    
    // 获取文件blob
    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error('下载的文件为空');
    }
    
    // 使用通用blob下载函数
    return await downloadBlob(blob, downloadFileName, 'application/zip');
  } catch (error) {
    console.error(`文件夹下载失败:`, error);
    message.error(`下载失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

/**
 * 下载文件（ZIP方式）
 * 处理单个或多个文件的ZIP打包下载
 * 
 * @param fileId 文件ID
 * @param fileName 可选的自定义文件名
 * @returns 是否下载成功
 */
export async function downloadFile(fileId: string, fileName?: string): Promise<boolean> {
  try {
    // 使用ZIP下载API路径
    const downloadUrl = `${API_PATHS.STORAGE.FILES.DOWNLOAD}?t=${Date.now()}`;
    
    // 发送POST请求
    const response = await fetch(downloadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify({ fileIds: [fileId] }),
      credentials: 'include'
    });

    if (!response || !response.ok) {
      throw new Error(`文件下载请求失败: ${response?.status || 'Failed to fetch'}`);
    }
    
    // 获取文件名
    let downloadFileName = fileName;
    if (!downloadFileName) {
      // 尝试从Content-Disposition头获取文件名
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const matches = /filename="?([^"]*)"?/i.exec(contentDisposition);
        if (matches && matches[1]) {
          downloadFileName = decodeURIComponent(matches[1]);
        }
      }
      
      // 如果还是没有文件名，使用默认名称
      if (!downloadFileName) {
        downloadFileName = '下载文件';
      }
    }
    
    // 获取文件blob
    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error('下载的文件为空');
    }
    
    // 使用通用blob下载函数
    return await downloadBlob(blob, downloadFileName);
  } catch (error) {
    console.error(`文件下载失败:`, error);
    message.error(`下载失败: ${error instanceof Error ? error.message : 'Failed to fetch'}`);
    return false;
  }
}

/**
 * 直接下载文件（不使用ZIP压缩）
 * 处理单个文件的直接下载请求
 * 
 * @param fileId 文件ID
 * @param fileName 可选的自定义文件名
 * @returns 是否下载成功
 */
export async function downloadFileDirect(fileId: string, fileName?: string): Promise<boolean> {
  try {
    // 使用直接下载API路径
    const downloadUrl = `${API_PATHS.STORAGE.FILES.DOWNLOAD_DIRECT}?fileId=${fileId}&t=${Date.now()}`;
    
    // 发送GET请求
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      credentials: 'include'
    });

    if (!response || !response.ok) {
      // 尝试解析错误详情
      try {
        const errorData = await response.clone().json();
        throw new Error(`文件下载请求失败: ${errorData.error || response?.status || 'Unknown error'}`);
      } catch (parseError) {
        throw new Error(`文件下载请求失败: ${response?.status || 'Unknown error'}`);
      }
    }
    
    // 获取文件名
    let downloadFileName = fileName;
    if (!downloadFileName) {
      // 尝试从Content-Disposition头获取文件名
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const matches = /filename="?([^"]*)"?/i.exec(contentDisposition);
        if (matches && matches[1]) {
          downloadFileName = decodeURIComponent(matches[1]);
        }
      }
      
      // 如果还是没有文件名，使用默认名称
      if (!downloadFileName) {
        downloadFileName = '下载文件';
      }
    }
    
    // 获取文件blob
    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error('下载的文件为空');
    }
    
    // 使用通用blob下载函数
    return await downloadBlob(blob, downloadFileName);
  } catch (error) {
    console.error(`直接文件下载失败:`, error);
    message.error(`下载失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

/**
 * 下载多个文件
 * 处理多个文件的ZIP打包下载
 * 
 * @param fileIds 多个文件ID数组
 * @param customFileName 可选的自定义文件名
 * @returns 是否下载成功
 */
export async function downloadMultipleFiles(fileIds: string[], customFileName?: string): Promise<boolean> {
  try {
    if (!fileIds.length) {
      message.warning('没有选择要下载的文件');
      return false;
    }
    
    // 使用ZIP下载API路径
    const downloadUrl = `${API_PATHS.STORAGE.FILES.DOWNLOAD}?t=${Date.now()}`;
    
    // 发送POST请求
    const response = await fetch(downloadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify({ fileIds }),
      credentials: 'include'
    });

    if (!response || !response.ok) {
      throw new Error(`多文件下载请求失败: ${response?.status || 'Failed to fetch'}`);
    }
    
    // 获取文件名
    let downloadFileName = customFileName || '多文件下载';
    
    // 尝试从Content-Disposition头获取文件名
    const contentDisposition = response.headers.get('Content-Disposition');
    if (contentDisposition) {
      const matches = /filename="?([^"]*)"?/i.exec(contentDisposition);
      if (matches && matches[1]) {
        downloadFileName = decodeURIComponent(matches[1]);
      }
    }
    
    // 确保文件名有zip扩展名
    if (!downloadFileName.toLowerCase().endsWith('.zip')) {
      downloadFileName += '.zip';
    }
    
    // 获取文件blob
    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error('下载的文件为空');
    }
    
    // 使用通用blob下载函数
    return await downloadBlob(blob, downloadFileName, 'application/zip');
  } catch (error) {
    console.error(`多文件下载失败:`, error);
    message.error(`下载失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
} 