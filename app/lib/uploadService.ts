/**
 * 上传服务模块
 * 提供文件和文件夹上传的统一处理逻辑
 */

import { API_PATHS } from '@/app/lib/api/paths';

/**
 * 上传进度事件处理器
 */
export interface UploadProgressHandler {
  (progress: number): void;
}

/**
 * 上传成功事件处理器
 */
export interface UploadSuccessHandler {
  (response: any): void;
}

/**
 * 上传错误事件处理器
 */
export interface UploadErrorHandler {
  (error: Error): void;
}

/**
 * 上传选项配置
 */
export interface UploadOptions {
  folderId?: string;
  tags?: string[];
  onProgress?: UploadProgressHandler;
  onSuccess?: UploadSuccessHandler;
  onError?: UploadErrorHandler;
}

/**
 * 使用XMLHttpRequest上传单个文件
 * 支持进度跟踪
 * 
 * @param file 要上传的文件
 * @param options 上传选项
 * @returns 上传任务控制对象
 */
export function uploadFile(file: File, options: UploadOptions = {}) {
  const {
    folderId,
    tags,
    onProgress = () => {},
    onSuccess = () => {},
    onError = () => {}
  } = options;

  // 创建表单数据
  const formData = new FormData();
  formData.append('file', file);
  if (folderId) {
    formData.append('folderId', folderId);
  }
  if (tags && tags.length > 0) {
    formData.append('tags', JSON.stringify(tags));
  }

  // 创建XHR请求
  const xhr = new XMLHttpRequest();
  xhr.open('POST', API_PATHS.STORAGE.FILES.UPLOAD, true);

  // 监听上传进度
  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const percentComplete = (e.loaded / e.total) * 100;
      onProgress(Math.round(percentComplete));
    }
  };

  // 请求完成处理
  xhr.onload = () => {
    if (xhr.status === 200) {
      try {
        const response = JSON.parse(xhr.responseText);
        onSuccess(response);
      } catch (error) {
        console.error('响应解析失败:', error, '原始响应:', xhr.responseText);
        
        // 尝试确定是否有任何可用数据
        let errorMessage = '响应解析失败';
        try {
          // 如果响应文本长度超过一定值，可能是有效负载但JSON格式不正确
          if (xhr.responseText && xhr.responseText.length > 0) {
            // 尝试使用宽松的方式解析JSON
            const cleanedText = xhr.responseText.trim().replace(/[\r\n]+/g, ' ');
            // 如果是简单的文本消息，可以直接使用
            if (!cleanedText.startsWith('{') && !cleanedText.startsWith('[')) {
              errorMessage = `服务器响应: ${cleanedText}`;
            }
          }
        } catch (secondError) {
          // 忽略二次解析错误
        }
        
        onError(new Error(errorMessage));
      }
    } else {
      let error;
      try {
        error = xhr.responseText ? JSON.parse(xhr.responseText) : { message: '上传失败' };
      } catch (parseError) {
        console.error('解析错误响应失败:', parseError);
        error = { message: '上传失败 (无法解析错误详情)' };
      }
      onError(new Error(error.message || '上传失败'));
    }
  };

  // 网络错误处理
  xhr.onerror = () => {
    onError(new Error('网络错误'));
  };

  // 发送请求
  xhr.send(formData);

  // 返回控制对象
  return {
    abort: () => xhr.abort()
  };
}

/**
 * 使用异步fetch上传单个文件
 * 不支持进度跟踪，适用于简单上传场景
 * 
 * @param file 要上传的文件
 * @param options 上传选项
 * @returns Promise 上传结果
 */
export async function uploadFileAsync(file: File, options: Omit<UploadOptions, 'onProgress'> = {}) {
  const { folderId, tags } = options;

  // 创建表单数据
  const formData = new FormData();
  formData.append('file', file);
  if (folderId) {
    formData.append('folderId', folderId);
  }
  if (tags && tags.length > 0) {
    formData.append('tags', JSON.stringify(tags));
  }

  try {
    const response = await fetch(API_PATHS.STORAGE.FILES.UPLOAD, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || '上传失败');
    }

    return await response.json();
  } catch (error) {
    if (options.onError) {
      options.onError(error instanceof Error ? error : new Error('上传失败'));
    }
    throw error;
  }
}

/**
 * 使用XMLHttpRequest上传文件夹
 * 
 * @param files 要上传的文件列表
 * @param folderName 文件夹名称
 * @param options 上传选项
 * @returns Promise 上传结果
 */
export async function uploadFolder(files: File[], folderName: string, options: UploadOptions = {}) {
  const { folderId, tags, onProgress = () => {}, onSuccess = () => {}, onError = () => {} } = options;
  
  if (files.length === 0) {
    onError(new Error('没有文件可上传'));
    return;
  }
  
  try {
    // 表单数据
    const formData = new FormData();
    formData.append('folderName', folderName);
    
    if (folderId) {
      formData.append('parentId', folderId);
    }
    
    if (tags && tags.length > 0) {
      formData.append('tags', JSON.stringify(tags));
    }
    
    // 创建XHR请求
    const xhr = new XMLHttpRequest();
    xhr.open('POST', API_PATHS.STORAGE.FOLDERS.CREATE, true);
    
    xhr.onload = async () => {
      if (xhr.status === 200) {
        try {
          const folderResponse = JSON.parse(xhr.responseText);
          const newFolderId = folderResponse.id;
          
          // 上传文件到新创建的文件夹
          let uploadedCount = 0;
          for (const file of files) {
            await uploadFile(file, {
              folderId: newFolderId,
              tags,
              onProgress: (fileProgress) => {
                // 计算总体进度：已完成文件 + 当前文件进度
                const totalProgress = Math.round(
                  (uploadedCount * 100 + fileProgress) / files.length
                );
                onProgress(totalProgress);
              },
            });
            uploadedCount++;
          }
          
          onSuccess(folderResponse);
        } catch (error) {
          onError(error instanceof Error ? error : new Error('文件夹上传失败'));
        }
      } else {
        const error = xhr.responseText ? JSON.parse(xhr.responseText) : { message: '创建文件夹失败' };
        onError(new Error(error.message || '创建文件夹失败'));
      }
    };
    
    xhr.onerror = () => {
      onError(new Error('网络错误'));
    };
    
    xhr.send(formData);
    
  } catch (error) {
    onError(error instanceof Error ? error : new Error('文件夹上传失败'));
  }
}

/**
 * 处理从文件选择器或拖放区域获取的文件列表
 * 
 * @param fileList 原始文件列表
 * @param isFolderUpload 是否为文件夹上传
 * @returns 处理后的文件列表和文件夹信息
 */
export function processSelectedFiles(fileList: FileList | File[], isFolderUpload: boolean): {
  files: File[];
  folderName: string | null;
} {
  const files = Array.from(fileList);
  
  if (files.length === 0) {
    return { files: [], folderName: null };
  }
  
  // 如果是文件夹上传，尝试获取文件夹名称
  let folderName: string | null = null;
  if (isFolderUpload) {
    const firstFile = files[0] as any;
    if (firstFile.webkitRelativePath) {
      folderName = firstFile.webkitRelativePath.split('/')[0];
    }
  }
  
  return { files, folderName };
} 