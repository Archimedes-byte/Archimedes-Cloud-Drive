/**
 * 存储下载工具函数
 * 提供文件和文件夹下载相关的功能
 */
import { API_PATHS } from '@/app/lib/api/paths';
import { message } from 'antd';
import { handleApiResponse } from '@/app/utils/error';

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
    console.log(`[下载工具] 开始下载Blob: ${fileName} (${blob.size} 字节)`);
    
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
    
    console.log(`[下载工具] Blob下载成功: ${fileName}`);
    return true;
  } catch (error) {
    console.error('[下载工具] 下载Blob失败:', error);
    message.error('下载文件失败');
    return false;
  }
}

/**
 * 下载文件夹（将作为zip包下载）
 * 
 * @param folderId 文件夹ID
 * @param folderName 可选的文件夹名
 * @returns 是否成功触发下载
 */
export async function downloadFolder(folderId: string, folderName?: string): Promise<boolean> {
  console.log(`[下载工具] 开始下载文件夹: ${folderId}`);
  
  try {
    // 使用文件下载API，但标记为文件夹
    const downloadUrl = `${API_PATHS.STORAGE.FILES.DOWNLOAD}?folderId=${folderId}`;
    
    // 创建一个隐藏的a标签进行下载
    const link = document.createElement('a');
    link.href = downloadUrl;
    
    // 如果提供了文件夹名，设置下载文件名
    let fileName = folderName || `folder_${folderId}`;
    if (!fileName.toLowerCase().endsWith('.zip')) {
      fileName += '.zip';
    }
    link.download = fileName;
    
    // 触发点击事件
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`[下载工具] 文件夹下载请求已发送: ${folderId}`);
    return true;
  } catch (error) {
    console.error('[下载工具] 下载文件夹失败:', error);
    return false;
  }
}

/**
 * 下载单个文件
 * @param fileId 文件ID
 * @param fileName 可选的文件名
 * @returns 是否下载成功
 */
export async function downloadFile(fileId: string, fileName?: string): Promise<boolean> {
  try {
    console.log(`[下载工具] 开始下载文件: ${fileId}`);
    
    // 构建下载链接 - 使用标准下载API并传递单个fileId
    const downloadUrl = `${API_PATHS.STORAGE.FILES.DOWNLOAD}?fileId=${fileId}`;
    
    // 创建一个隐藏的a标签进行下载
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_blank';
    
    // 如果提供了文件名，设置下载文件名
    if (fileName) {
      link.download = fileName;
    }
    
    // 触发点击事件
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`[下载工具] 文件下载请求已发送: ${fileId}`);
    return true;
  } catch (error) {
    console.error('[下载工具] 下载文件失败:', error);
    return false;
  }
}

/**
 * 获取文件Blob对象
 * @param fileIds 要下载的文件ID列表
 * @returns 文件Blob对象
 */
export async function getFileBlob(fileIds: string[]): Promise<Blob> {
  if (!fileIds || !fileIds.length) {
    throw new Error('需要提供要下载的文件ID');
  }
  
  try {
    console.log(`[下载工具] 开始获取文件Blob: ${fileIds.join(', ')}`);
    
    // 发送API请求获取文件
    const response = await fetch(API_PATHS.STORAGE.FILES.DOWNLOAD, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileIds }),
    });
    
    // 验证响应状态
    if (!response.ok) {
      throw new Error(`下载请求失败: ${response.status}`);
    }
    
    // 获取blob并返回
    return await response.blob();
  } catch (error) {
    console.error('[下载工具] 获取文件Blob失败:', error);
    throw error;
  }
} 