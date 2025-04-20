// 文件下载工具函数
import { API_PATHS } from '@/app/lib/api/paths';

/**
 * 文件夹下载增强方法
 * 使用多种技术确保文件夹ZIP下载的可靠性
 * 
 * @param folderId 文件夹ID
 * @param fileName 可选的文件名
 * @returns 是否成功触发下载
 */
export async function downloadFolder(folderId: string, fileName?: string): Promise<boolean> {
  console.log(`开始下载文件夹: ${folderId}`);
  
  try {
    // 构建请求
    const request = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds: [folderId] }),
    };
    
    // 发起请求
    console.log('发送下载请求...');
    const response = await fetch(API_PATHS.STORAGE.FILES.DOWNLOAD, request);
    
    if (!response.ok) {
      console.error('下载请求失败:', response.status, response.statusText);
      return false;
    }
    
    // 获取文件Blob
    const blob = await response.blob();
    if (blob.size === 0) {
      console.error('下载的文件为空');
      return false;
    }
    
    // 设置文件名
    let downloadFileName = fileName || '下载文件.zip';
    if (!downloadFileName.toLowerCase().endsWith('.zip')) {
      downloadFileName += '.zip';
    }
    
    // 创建blob URL
    const blobUrl = URL.createObjectURL(blob);
    
    try {
      // 标准的下载方法
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = downloadFileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // 给浏览器一些时间处理下载
      setTimeout(() => {
        try {
          document.body.removeChild(link);
        } catch (e) {
          // 忽略清理错误
        }
      }, 500);
      
      return true;
    } finally {
      // 清理blob URL
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    }
  } catch (error) {
    console.error('下载方法失败:', error);
    return false;
  }
} 