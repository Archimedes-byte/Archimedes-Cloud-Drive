import { useState, useCallback } from 'react';
import { message } from 'antd';
import { FileInfo, FileWithProgress } from '@/app/shared/types/file';

type RefreshCallback = () => void;

/**
 * 创建自定义上传Hook接口
 */
export interface CustomFileUploadHook {
  isUploading: boolean;
  uploadProgress: number;
  handleUpload: (files: File[], folderId?: string | null) => Promise<void>;
  handleFolderUpload: (folderItems: FileSystemEntry[], folderId?: string | null) => Promise<void>;
}

/**
 * 统一的文件上传钩子
 * 提供文件和文件夹上传功能
 */
export function useFileUpload(onRefresh: RefreshCallback): CustomFileUploadHook & {
  isUploadModalOpen: boolean;
  setIsUploadModalOpen: (open: boolean) => void;
  isFolderUploadModalOpen: boolean;
  setIsFolderUploadModalOpen: (open: boolean) => void;
  uploadError: string | null;
} {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFolderUploadModalOpen, setIsFolderUploadModalOpen] = useState(false);

  const handleUpload = useCallback(async (files: File[], folderId: string | null = null) => {
    if (!files.length) {
      message.warning('请选择要上传的文件');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
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
      
      // 添加标签（可选）
      formData.append('tags', JSON.stringify([]));
      
      // 创建请求
      const xhr = new XMLHttpRequest();
      
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
            const response = JSON.parse(xhr.responseText);
            
            if (response.success) {
              message.success(`成功上传 ${files.length} 个文件`);
              resolve();
            } else {
              reject(new Error(response.error || '上传失败'));
            }
          } else {
            reject(new Error('上传失败，服务器返回错误'));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('网络错误，上传失败'));
        };
        
        xhr.send(formData);
      });
      
      // 关闭上传模态框并刷新文件列表
      setIsUploadModalOpen(false);
      onRefresh();
    } catch (error) {
      console.error('上传文件错误:', error);
      message.error(error instanceof Error ? error.message : '上传失败，请重试');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [onRefresh]);

  const handleFolderUpload = useCallback(async (folderItems: FileSystemEntry[], folderId: string | null = null) => {
    if (!folderItems.length) {
      message.warning('请选择要上传的文件夹');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
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
        return;
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
      
      // 创建请求
      const xhr = new XMLHttpRequest();
      
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
            const response = JSON.parse(xhr.responseText);
            
            if (response.success) {
              message.success(`成功上传文件夹，包含 ${allFiles.length} 个文件`);
              resolve();
            } else {
              reject(new Error(response.error || '上传失败'));
            }
          } else {
            reject(new Error('上传失败，服务器返回错误'));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('网络错误，上传失败'));
        };
        
        xhr.send(formData);
      });
      
      // 关闭上传模态框并刷新文件列表
      setIsUploadModalOpen(false);
      onRefresh();
    } catch (error) {
      console.error('上传文件夹错误:', error);
      message.error(error instanceof Error ? error.message : '上传文件夹失败，请重试');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [onRefresh]);

  return {
    isUploading,
    uploadProgress,
    handleUpload,
    handleFolderUpload,
    isUploadModalOpen,
    setIsUploadModalOpen,
    isFolderUploadModalOpen,
    setIsFolderUploadModalOpen,
    uploadError
  };
} 