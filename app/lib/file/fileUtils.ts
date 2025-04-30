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
    if (!blob && url) {
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          // 确保URL是有效的HTTP/HTTPS URL
          const validUrl = url.startsWith('http') ? url : url;
          if (!validUrl) {
            console.error('无效的下载URL:', url);
            throw new Error('无效的下载URL');
          }
          
          // 检查URL中是否包含fileId参数
          const hasFileId = url.includes('fileId=');
          
          // 根据URL判断请求方法，如果有fileId参数则使用POST方法
          const method = hasFileId || url.includes('/download?') ? 'POST' : 'GET';
          const requestOptions: RequestInit = {
            method,
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            },
            credentials: 'include'
          };
          
          // 如果是POST请求且URL中包含fileId，则添加JSON请求头和提取fileId作为请求体
          if (method === 'POST') {
            requestOptions.headers = {
              ...requestOptions.headers,
              'Content-Type': 'application/json'
            };
            
            // 从URL中提取fileId参数
            if (hasFileId) {
              const fileIdMatch = url.match(/fileId=([^&]+)/);
              if (fileIdMatch && fileIdMatch[1]) {
                const fileId = fileIdMatch[1];
                requestOptions.body = JSON.stringify({ fileIds: [fileId] });
              }
            }
          }
          
          const response = await fetch(validUrl, requestOptions);
          
          if (!response.ok) {
            throw new Error(`下载失败，状态码: ${response.status}`);
          }
          
          blob = await response.blob();
          
          // 验证blob是否有效
          if (!blob || blob.size === 0) {
            throw new Error('获取到的文件内容为空');
          }
          
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
          
          // 成功获取blob，跳出重试循环
          break;
        } catch (fetchError) {
          console.error(`下载尝试 ${retryCount + 1}/${maxRetries + 1} 失败:`, fetchError);
          retryCount++;
          
          if (retryCount > maxRetries) {
            // 重试次数已用尽，抛出最后的错误
            throw fetchError;
          }
          
          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // 如果没有blob，说明下载失败
    if (!blob) {
      console.error('获取文件内容失败，URL:', url, '文件名:', fileName);
      throw new Error('获取文件内容失败');
    }
    
    // 创建下载链接
    const blobUrl = blob instanceof Blob ? 
      URL.createObjectURL(new Blob([blob], { type: contentType })) : 
      url;
      
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName || '下载文件';
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
        console.warn('清理下载链接时出错:', e);
      }
    }, 1000);
    
    message.success({ content: '下载成功', key: 'fileDownload' });
    return true;
  } catch (error) {
    // 更详细的错误日志
    console.error('下载文件失败详情:', {
      url,
      fileName,
      contentType,
      blobProvided: !!blob,
      error
    });
    handleApiError(error, '下载文件失败', true);
    // 如果出现特定错误，提供更具体的提示
    if (error instanceof Error && error.message.includes('获取文件内容失败')) {
      message.error({ 
        content: '无法获取文件内容，请检查网络连接或稍后重试',
        key: 'fileDownload' 
      });
    }
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
    
    // 修改：使用与文件下载相同的API端点，通过POST方法传递要下载的文件夹ID
    const downloadUrl = `${API_PATHS.STORAGE.FILES.DOWNLOAD}?_t=${Date.now()}`;
    
    console.log(`[downloadFolderHelper] 开始下载文件夹, ID: ${folderId}, URL: ${downloadUrl}`);
    
    // 直接使用fetch实现文件夹下载
    const response = await fetch(downloadUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify({ 
        fileIds: [folderId],
        isFolder: true  // 告诉服务器这是文件夹下载
      }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('文件夹下载请求失败:', response.status, errorData);
      throw new Error(errorData.error || `下载失败 (${response.status})`);
    }
    
    // 获取blob
    const blob = await response.blob();
    
    // 验证blob
    if (!blob || blob.size === 0) {
      throw new Error('获取到的文件内容为空');
    }
    
    console.log('获取到文件夹压缩包:', blob.size, 'bytes');
    
    // 使用通用下载工具
    const fileName = `${folderName}.zip`;
    const contentType = 'application/zip';
    
    // 使用主下载函数直接处理blob，但不显示额外成功消息
    // fileDownload消息键已在downloadFileHelper中使用
    const result = await downloadFileHelper(
      '',  // 不需要URL，直接使用blob
      fileName,
      contentType,
      blob
    );
    
    if (!result) {
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