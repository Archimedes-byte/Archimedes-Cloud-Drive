import { useState, useCallback, useRef } from 'react';
import { message } from 'antd';

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
      
      // 创建请求
      const xhr = new XMLHttpRequest();
      currentXhrRef.current = xhr;
      
      // 监听上传进度
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });
      
      // 返回一个Promise以便能够在上传完成后执行后续操作
      await new Promise<void>((resolve, reject) => {
        xhr.open('POST', '/api/files/upload');
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              
              if (response.success) {
                message.success(`成功上传 ${files.length} 个文件`);
                resolve();
              } else {
                reject(new Error(response.error || '上传失败'));
              }
            } catch (error) {
              reject(new Error('解析服务器响应失败'));
            }
          } else {
            reject(new Error(`上传失败，服务器返回状态码: ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('网络错误，上传失败'));
        };
        
        xhr.onabort = () => {
          reject(new Error('上传已取消'));
        };
        
        xhr.send(formData);
      });
      
      // 关闭上传模态框并执行成功回调
      setIsUploadModalOpen(false);
      if (onSuccess) onSuccess();
      return true;
    } catch (error) {
      console.error('上传文件错误:', error);
      const errorMessage = error instanceof Error ? error.message : '上传失败，请重试';
      setUploadError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setIsUploading(false);
      currentXhrRef.current = null;
    }
  }, [onSuccess]);

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
      });
      
      // 添加文件夹上传标志
      formData.append('isFolderUpload', 'true');
      
      if (folderId) {
        formData.append('folderId', folderId);
      }
      
      // 添加标签
      formData.append('tags', JSON.stringify(tags));
      
      // 创建请求
      const xhr = new XMLHttpRequest();
      currentXhrRef.current = xhr;
      
      // 监听上传进度
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });
      
      // 返回一个Promise以便能够在上传完成后执行后续操作
      await new Promise<void>((resolve, reject) => {
        // 统一使用同一个API路径处理文件夹上传
        xhr.open('POST', '/api/files/upload');
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              
              if (response.success) {
                message.success(`成功上传文件夹，包含 ${allFiles.length} 个文件`);
                resolve();
              } else {
                reject(new Error(response.error || '上传失败'));
              }
            } catch (error) {
              reject(new Error('解析服务器响应失败'));
            }
          } else {
            reject(new Error(`上传失败，服务器返回状态码: ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('网络错误，上传失败'));
        };
        
        xhr.onabort = () => {
          reject(new Error('上传已取消'));
        };
        
        xhr.send(formData);
      });
      
      // 关闭上传模态框并执行成功回调
      setIsFolderUploadModalOpen(false);
      if (onSuccess) onSuccess();
      return true;
    } catch (error) {
      console.error('上传文件夹错误:', error);
      const errorMessage = error instanceof Error ? error.message : '上传文件夹失败，请重试';
      setUploadError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setIsUploading(false);
      currentXhrRef.current = null;
    }
  }, [onSuccess]);

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