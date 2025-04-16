import { useState, useCallback, useRef } from 'react';
import { message } from 'antd';
import { API_PATHS } from '@/app/lib/api/paths';

/**
 * 文件上传钩子接口
 */
export interface FileUploadHook {
  /** 是否正在上传 */
  isUploading: boolean;
  /** 上传进度 (0-100) */
  uploadProgress: number;
  /** 上传错误信息 */
  uploadError: string | null;
  /** 文件上传模态框是否打开 */
  isUploadModalOpen: boolean;
  /** 设置文件上传模态框状态 */
  setIsUploadModalOpen: (open: boolean) => void;
  /** 文件夹上传模态框是否打开 */
  isFolderUploadModalOpen: boolean;
  /** 设置文件夹上传模态框状态 */
  setIsFolderUploadModalOpen: (open: boolean) => void;
  /** 上传文件 */
  uploadFiles: (files: File[], folderId?: string | null, tags?: string[]) => Promise<boolean>;
  /** 上传文件夹 */
  uploadFolder: (folderItems: FileSystemEntry[], folderId?: string | null, tags?: string[]) => Promise<boolean>;
  /** 取消上传 */
  cancelUpload: () => void;
}

/**
 * 文件上传钩子
 * 提供文件和文件夹的上传功能
 * 
 * @param onSuccess 上传成功回调函数
 * @returns 文件上传相关状态和方法
 */
export const useFileUpload = (onSuccess?: () => void): FileUploadHook => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFolderUploadModalOpen, setIsFolderUploadModalOpen] = useState(false);
  
  // 使用ref存储当前XHR请求，以便能够取消
  const currentXhrRef = useRef<XMLHttpRequest | null>(null);

  /**
   * 上传文件
   * @param files 文件列表
   * @param folderId 目标文件夹ID
   * @param tags 标签列表
   * @returns 是否上传成功
   */
  const uploadFiles = useCallback(async (
    files: File[], 
    folderId: string | null = null,
    tags: string[] = []
  ): Promise<boolean> => {
    if (!files.length) {
      message.warning('请选择要上传的文件');
      return false;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    
    console.log(`开始上传 ${files.length} 个文件`, { 
      folderId,
      tagsCount: tags.length,
      filesInfo: files.map(f => ({ name: f.name, size: f.size, type: f.type }))
    });
    
    try {
      const formData = new FormData();
      
      // 添加所有文件到表单
      files.forEach(file => {
        formData.append('file', file);
      });
      
      // 添加目标文件夹ID（如果有）
      if (folderId) {
        formData.append('folderId', folderId);
      }
      
      // 添加标签
      formData.append('tags', JSON.stringify(tags));
      
      // 添加时间戳以避免缓存问题
      formData.append('_t', Date.now().toString());
      
      // 创建请求
      const xhr = new XMLHttpRequest();
      currentXhrRef.current = xhr;
      
      // 监听上传进度
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
          console.log(`上传进度: ${progress}%`);
        }
      });
      
      // 返回一个Promise以便能够在上传完成后执行后续操作
      await new Promise<void>((resolve, reject) => {
        xhr.open('POST', API_PATHS.STORAGE.FILES.UPLOAD);
        
        // 添加请求头，防止缓存
        xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        xhr.setRequestHeader('Pragma', 'no-cache');
        xhr.setRequestHeader('Expires', '0');
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              console.log('上传文件响应:', response);
              
              if (response.success) {
                const uploadedFiles = response.data;
                const fileNames = Array.isArray(uploadedFiles) 
                  ? uploadedFiles.map((f: any) => f.name).join(', ')
                  : (uploadedFiles?.name || '未知');
                
                console.log(`上传成功，文件数: ${Array.isArray(uploadedFiles) ? uploadedFiles.length : 1}, 文件名: ${fileNames}`);
                
                // 确保上传进度为100%
                setUploadProgress(100);
                
                // 显示成功消息
                message.success(`成功上传 ${files.length} 个文件`);
                resolve();
              } else {
                console.error('上传失败，服务器返回错误:', response.error);
                setUploadError(response.error || '上传失败');
                message.error(response.error || '上传失败');
                reject(new Error(response.error || '上传失败'));
              }
            } catch (error) {
              console.error('解析服务器响应失败:', error, xhr.responseText);
              const errorMessage = '解析服务器响应失败';
              setUploadError(errorMessage);
              message.error(errorMessage);
              reject(new Error(errorMessage));
            }
          } else {
            const errorMessage = `上传失败，服务器返回状态码: ${xhr.status}`;
            console.error(errorMessage);
            setUploadError(errorMessage);
            message.error(errorMessage);
            reject(new Error(errorMessage));
          }
        };
        
        xhr.onerror = () => {
          const errorMessage = '网络错误，上传失败';
          console.error(errorMessage);
          setUploadError(errorMessage);
          message.error(errorMessage);
          reject(new Error(errorMessage));
        };
        
        xhr.onabort = () => {
          const errorMessage = '上传已取消';
          console.warn(errorMessage);
          setUploadError(errorMessage);
          message.info(errorMessage);
          reject(new Error(errorMessage));
        };

        // 设置超时处理
        xhr.timeout = 300000; // 5分钟超时
        xhr.ontimeout = () => {
          const errorMessage = '上传超时，请检查网络或文件大小';
          console.error(errorMessage);
          setUploadError(errorMessage);
          message.error(errorMessage);
          reject(new Error(errorMessage));
        };
        
        // 发送请求
        console.log('开始发送上传请求');
        xhr.send(formData);
      });
      
      // 检查最终状态
      if (uploadError) {
        console.error('上传过程中发生错误:', uploadError);
        return false;
      }

      // 确保上传进度为100%
      if (uploadProgress !== 100) {
        console.warn(`上传完成但进度未达到100%，强制设置为100%`);
        setUploadProgress(100);
      }
      
      // 延迟一下执行成功回调，确保后端处理完毕
      console.log('延迟执行上传成功回调');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 关闭上传模态框并执行成功回调
      setIsUploadModalOpen(false);
      if (onSuccess) {
        console.log('执行上传成功回调');
        onSuccess();
      }
      
      return true;
    } catch (error) {
      console.error('上传文件错误:', error);
      const errorMessage = error instanceof Error ? error.message : '上传失败，请重试';
      
      // 确保错误状态被正确设置
      setUploadError(errorMessage);
      // 如果进度显示100%但实际上传失败，重置进度
      if (uploadProgress === 100) {
        console.warn('上传失败但进度显示100%，重置进度');
        setUploadProgress(0);
      }
      
      message.error(errorMessage);
      return false;
    } finally {
      // 确保上传状态被重置，但保留最终进度和错误信息
      setTimeout(() => {
        setIsUploading(false);
        currentXhrRef.current = null;
        console.log('上传流程结束，状态已重置');
      }, 300);
    }
  }, [onSuccess, uploadError, uploadProgress]);

  /**
   * 上传文件夹
   * @param folderItems 文件系统条目列表
   * @param folderId 目标文件夹ID
   * @param tags 标签列表
   * @returns 是否上传成功
   */
  const uploadFolder = useCallback(async (
    folderItems: FileSystemEntry[], 
    folderId: string | null = null,
    tags: string[] = []
  ): Promise<boolean> => {
    if (!folderItems.length) {
      message.warning('请选择要上传的文件夹');
      return false;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    
    console.log(`开始处理文件夹上传，包含 ${folderItems.length} 个顶级条目`);
    
    try {
      // 递归处理文件夹内容
      const processEntry = async (entry: FileSystemEntry, path: string) => {
        if (entry.isFile) {
          const fileEntry = entry as FileSystemFileEntry;
          
          return new Promise<{file: File, path: string}>((resolve, reject) => {
            fileEntry.file(
              (file) => {
                // 创建包含路径信息的自定义File对象
                const customFile = new File(
                  [file], 
                  file.name, 
                  { type: file.type, lastModified: file.lastModified }
                );
                resolve({ file: customFile, path });
              },
              (error) => reject(error)
            );
          });
        } else if (entry.isDirectory) {
          const dirEntry = entry as FileSystemDirectoryEntry;
          const dirReader = dirEntry.createReader();
          
          return new Promise<Array<{file: File, path: string}>>((resolve, reject) => {
            const allEntries: Array<{file: File, path: string}> = [];
            
            const readEntries = () => {
              dirReader.readEntries(async (entries) => {
                if (entries.length) {
                  try {
                    const subEntries = await Promise.all(
                      entries.map(subEntry => 
                        processEntry(subEntry, `${path}/${subEntry.name}`)
                      )
                    );
                    
                    // 扁平化结果数组并添加到总列表
                    const flattenedResults = subEntries.flat();
                    allEntries.push(...flattenedResults);
                    
                    // 继续读取更多条目
                    readEntries();
                  } catch (error) {
                    reject(error);
                  }
                } else {
                  // 没有更多条目
                  resolve(allEntries);
                }
              }, reject);
            };
            
            readEntries();
          });
        }
        
        return [];
      };
      
      // 处理所有顶级条目
      console.log('开始递归处理文件夹结构');
      const allFiles: {file: File, path: string}[] = [];
      for (const entry of folderItems) {
        const result = await processEntry(entry, entry.name);
        if (Array.isArray(result)) {
          allFiles.push(...result);
        } else if (result) {
          allFiles.push(result);
        }
      }
      
      if (allFiles.length === 0) {
        console.warn('选择的文件夹中没有文件');
        message.warning('选择的文件夹中没有文件');
        setIsUploading(false);
        return false;
      }

      console.log(`准备上传文件夹中的 ${allFiles.length} 个文件，包含路径信息`);
      
      // 上传所有文件及其路径信息
      const formData = new FormData();
      
      allFiles.forEach(({ file, path }, index) => {
        formData.append('file', file);
        // 以索引为键存储路径信息
        formData.append(`paths_${index}`, path);
        
        console.log(`添加文件 ${index + 1}/${allFiles.length}:
          - 名称: ${file.name}
          - 路径: ${path}
          - 大小: ${(file.size / 1024).toFixed(2)} KB
          - 类型: ${file.type || '未知'}`);
      });
      
      // 添加文件夹上传标志
      formData.append('isFolderUpload', 'true');
      
      if (folderId) {
        formData.append('folderId', folderId);
        console.log(`目标文件夹ID: ${folderId}`);
      }
      
      // 添加标签
      formData.append('tags', JSON.stringify(tags));
      if (tags.length > 0) {
        console.log(`添加标签: ${tags.join(', ')}`);
      }
      
      // 添加时间戳以避免缓存问题
      formData.append('_t', Date.now().toString());
      
      // 创建请求
      const xhr = new XMLHttpRequest();
      currentXhrRef.current = xhr;
      
      // 监听上传进度
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
          console.log(`文件夹上传进度: ${progress}%`);
        }
      });
      
      // 返回一个Promise以便能够在上传完成后执行后续操作
      await new Promise<void>((resolve, reject) => {
        xhr.open('POST', API_PATHS.STORAGE.FILES.UPLOAD);
        
        // 添加请求头，防止缓存
        xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        xhr.setRequestHeader('Pragma', 'no-cache');
        xhr.setRequestHeader('Expires', '0');
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              console.log('文件夹上传响应:', response);
              
              if (response.success) {
                const uploadedFiles = response.data;
                const fileCount = Array.isArray(uploadedFiles) ? uploadedFiles.length : 0;
                
                console.log(`文件夹上传成功，文件数: ${fileCount}`);
                
                // 确保上传进度为100%
                setUploadProgress(100);
                
                // 显示成功消息
                message.success(`成功上传文件夹，包含 ${allFiles.length} 个文件`);
                resolve();
              } else {
                const errorMessage = response.error || '上传失败';
                console.error('文件夹上传失败，服务器返回错误:', errorMessage);
                setUploadError(errorMessage);
                message.error(errorMessage);
                reject(new Error(errorMessage));
              }
            } catch (error) {
              const errorMessage = '解析服务器响应失败';
              console.error(`${errorMessage}:`, error, xhr.responseText);
              setUploadError(errorMessage);
              message.error(errorMessage);
              reject(new Error(errorMessage));
            }
          } else {
            const errorMessage = `文件夹上传失败，服务器返回状态码: ${xhr.status}`;
            console.error(errorMessage);
            setUploadError(errorMessage);
            message.error(errorMessage);
            reject(new Error(errorMessage));
          }
        };
        
        xhr.onerror = () => {
          const errorMessage = '网络错误，文件夹上传失败';
          console.error(errorMessage);
          setUploadError(errorMessage);
          message.error(errorMessage);
          reject(new Error(errorMessage));
        };
        
        xhr.onabort = () => {
          const errorMessage = '文件夹上传已取消';
          console.warn(errorMessage);
          setUploadError(errorMessage);
          message.info(errorMessage);
          reject(new Error(errorMessage));
        };
        
        // 设置超时处理
        xhr.timeout = 600000; // 10分钟超时，文件夹上传可能需要更长时间
        xhr.ontimeout = () => {
          const errorMessage = '文件夹上传超时，请检查网络或文件数量';
          console.error(errorMessage);
          setUploadError(errorMessage);
          message.error(errorMessage);
          reject(new Error(errorMessage));
        };
        
        // 发送请求
        console.log('开始发送文件夹上传请求');
        xhr.send(formData);
      });
      
      // 检查最终状态
      if (uploadError) {
        console.error('文件夹上传过程中发生错误:', uploadError);
        return false;
      }

      // 确保上传进度为100%
      if (uploadProgress !== 100) {
        console.warn(`文件夹上传完成但进度未达到100%，强制设置为100%`);
        setUploadProgress(100);
      }
      
      // 延迟执行成功回调，确保后端处理完毕
      console.log('延迟执行文件夹上传成功回调');
      await new Promise(resolve => setTimeout(resolve, 800)); // 文件夹上传可能需要更长的处理时间
      
      // 关闭上传模态框并执行成功回调
      setIsFolderUploadModalOpen(false);
      if (onSuccess) {
        console.log('执行文件夹上传成功回调');
        onSuccess();
      }
      
      return true;
    } catch (error) {
      console.error('文件夹上传错误:', error);
      const errorMessage = error instanceof Error ? error.message : '文件夹上传失败，请重试';
      
      // 确保错误状态被正确设置
      setUploadError(errorMessage);
      // 如果进度显示100%但实际上传失败，重置进度
      if (uploadProgress === 100) {
        console.warn('文件夹上传失败但进度显示100%，重置进度');
        setUploadProgress(0);
      }
      
      message.error(errorMessage);
      return false;
    } finally {
      // 确保上传状态被重置，但保留最终进度和错误信息
      setTimeout(() => {
        setIsUploading(false);
        currentXhrRef.current = null;
        console.log('文件夹上传流程结束，状态已重置');
      }, 300);
    }
  }, [onSuccess, uploadError, uploadProgress]);

  /**
   * 取消上传
   */
  const cancelUpload = useCallback(() => {
    if (currentXhrRef.current && isUploading) {
      currentXhrRef.current.abort();
      message.info('上传已取消');
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [isUploading]);

  return {
    isUploading,
    uploadProgress,
    uploadError,
    isUploadModalOpen,
    setIsUploadModalOpen,
    isFolderUploadModalOpen,
    setIsFolderUploadModalOpen,
    uploadFiles,
    uploadFolder,
    cancelUpload
  };
}; 