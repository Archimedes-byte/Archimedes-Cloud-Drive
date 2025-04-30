/**
 * 存储下载工具函数
 * 提供文件和文件夹下载相关的功能
 */
import { API_PATHS } from '@/app/lib/api/paths';
import { message } from 'antd';

// 最大重试次数
const MAX_RETRY_COUNT = 3;
// 重试延迟（指数退避）
const RETRY_BASE_DELAY = 1000;

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
  
  // 重试计数器
  let retryCount = 0;
  let lastError: Error | null = null;
  
  // 使用重试逻辑来提高成功率
  while (retryCount < MAX_RETRY_COUNT) {
    try {
      if (retryCount > 0) {
        // 如果是重试，显示正在重试的消息
        message.info(`正在重试下载 (${retryCount}/${MAX_RETRY_COUNT})...`);
        // 使用指数退避策略
        await new Promise(resolve => setTimeout(resolve, RETRY_BASE_DELAY * Math.pow(2, retryCount - 1)));
      }
      
      // 构建请求
      const request: RequestInit = {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache' 
        },
        body: JSON.stringify({ 
          fileIds: [folderId],
          isFolder: true  // 添加isFolder标志表明这是文件夹下载
        }),
        // 随着重试增加超时时间
        signal: AbortSignal.timeout(120000 + retryCount * 30000), // 每次重试增加30秒
        credentials: 'include' // 确保包含凭证
      };
      
      // 发起请求
      console.log(`发送下载请求... (尝试 ${retryCount + 1}/${MAX_RETRY_COUNT})`);
      const response = await fetch(API_PATHS.STORAGE.FILES.DOWNLOAD, request);
      
      // 检查网络错误
      if (!response) {
        throw new Error("网络请求失败，未收到响应");
      }
      
      // 详细记录错误状态
      if (!response.ok) {
        // 尝试解析错误信息
        let errorMessage = `服务器响应错误: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error || errorData.message) {
            errorMessage = errorData.error || errorData.message;
          }
        } catch (e) {
          // 无法解析JSON，使用默认错误信息
        }
        
        throw new Error(errorMessage);
      }
      
      // 获取文件Blob
      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('下载的文件为空');
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
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          document.body.removeChild(link);
        } catch (e) {
          // 忽略清理错误
        }
        
        console.log('下载成功启动');
        return true;
      } finally {
        // 确保清理blob URL
        URL.revokeObjectURL(blobUrl);
      }
    } catch (error: any) {
      lastError = error;
      console.error(`下载尝试 ${retryCount + 1} 失败:`, error);
      retryCount++;
      
      // 如果已经是最后一次尝试，则跳出循环
      if (retryCount >= MAX_RETRY_COUNT) {
        console.error('所有下载尝试均失败');
        break;
      }
    }
  }
  
  // 所有常规方法都失败后，尝试备用方法
  try {
    console.log('尝试备用下载方法...');
    message.info('正在切换到备用下载方式，请稍候...');
    
    // 尝试使用备用下载API - 只保留一种备用方法
    const downloadUrl = `/api/storage/files/download-alt?t=${Date.now()}`;
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
    
    if (!response.ok) {
      throw new Error(`备用API响应错误: ${response.status}`);
    }
    
    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error('备用下载返回的文件为空');
    }
    
    // 设置文件名
    let downloadFileName = fileName || '下载文件.zip';
    if (!downloadFileName.toLowerCase().endsWith('.zip')) {
      downloadFileName += '.zip';
    }
    
    // 下载文件
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = downloadFileName;
    document.body.appendChild(link);
    link.click();
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    
    console.log('备用方式下载成功');
    return true;
  } catch (backupError) {
    console.error('备用下载方法失败:', backupError);
    message.error(`下载失败: ${lastError?.message || '网络错误'}`);
    return false;
  }
}

/**
 * 下载文件
 * 处理单个文件的下载请求
 * 
 * @param fileId 文件ID
 * @param fileName 可选的自定义文件名
 * @returns 是否下载成功
 */
export async function downloadFile(fileId: string, fileName?: string): Promise<boolean> {
  try {
    // 使用正确的文件下载API路径
    const downloadUrl = `${API_PATHS.STORAGE.FILES.DOWNLOAD}?t=${Date.now()}`;
    
    console.log(`[downloadFile] 开始下载文件, ID: ${fileId}, URL: ${downloadUrl}`);
    
    // 修改为POST请求，并在body中传递fileId
    const response = await fetch(downloadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify({ fileIds: [fileId] }), // 使用与多文件下载相同的参数格式
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
    
    const blobUrl = URL.createObjectURL(blob);
    
    try {
      // 创建并触发下载
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = downloadFileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        document.body.removeChild(link);
      } catch (e) {
        // 忽略清理错误
      }
      
      return true;
    } finally {
      // 清理blob URL
      URL.revokeObjectURL(blobUrl);
    }
  } catch (error: any) {
    console.error(`文件下载尝试失败:`, error);
    message.error(`下载失败: ${error?.message || 'Failed to fetch'}`);
    return false;
  }
} 