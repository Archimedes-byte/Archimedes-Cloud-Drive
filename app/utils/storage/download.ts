/**
 * 存储下载工具函数
 * 提供文件和文件夹下载相关的功能
 */
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
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache' 
      },
      body: JSON.stringify({ fileIds: [folderId] }),
      // 添加超时设置，避免长时间未响应
      signal: AbortSignal.timeout(120000) // 2分钟超时
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
    // 尝试使用备用方法 - 通过URL参数传递ID进行下载
    try {
      console.log('尝试使用备用下载方法...');
      const downloadUrl = `/api/storage/files/download-alt?fileId=${folderId}&t=${Date.now()}`;
      
      // 打开新窗口下载
      window.open(downloadUrl, '_blank');
      return true;
    } catch (backupError) {
      console.error('备用下载方法也失败:', backupError);
      return false;
    }
  }
}

/**
 * 单文件下载方法
 * 下载指定ID的单个文件
 * 
 * @param fileId 文件ID
 * @param fileName 可选的文件名
 * @returns 是否成功触发下载
 */
export async function downloadFile(fileId: string, fileName?: string): Promise<boolean> {
  try {
    // 创建下载链接
    const downloadUrl = `${API_PATHS.STORAGE.FILES.GET(fileId)}/download?t=${Date.now()}`;
    
    // 使用fetch API获取文件
    const response = await fetch(downloadUrl, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      // 添加超时设置
      signal: AbortSignal.timeout(60000) // 1分钟超时
    });
    
    if (!response.ok) {
      console.error('文件下载请求失败:', response.status, response.statusText);
      return false;
    }
    
    // 获取文件名
    let downloadFileName = fileName;
    if (!downloadFileName) {
      // 尝试从Content-Disposition头获取文件名
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const matches = /filename="?([^"]*)"?/i.exec(contentDisposition);
        if (matches && matches[1]) {
          downloadFileName = matches[1];
        }
      }
      
      // 如果还是没有文件名，使用默认名称
      if (!downloadFileName) {
        downloadFileName = '下载文件';
      }
    }
    
    // 获取文件blob
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    try {
      // 创建并触发下载
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = downloadFileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
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
    console.error('文件下载方法失败:', error);
    return false;
  }
} 