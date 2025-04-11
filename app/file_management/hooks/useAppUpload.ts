import { useCallback } from 'react';
import { useAppState } from '../context/AppStateContext';
import { FileInfo } from '@/app/types';
import { message } from 'antd';
import { useAppFiles } from './useAppFiles';

/**
 * 文件上传Hook - 基于全局状态管理
 * 负责处理文件和文件夹的上传功能
 */
export const useAppUpload = () => {
  const { state, dispatch } = useAppState();
  const { isUploading, uploadProgress, uploadError, currentFiles } = state.upload;
  const { loadFiles, currentFolderId } = useAppFiles();
  
  /**
   * 设置上传状态
   */
  const setIsUploading = useCallback((uploading: boolean) => {
    dispatch({ type: 'SET_IS_UPLOADING', payload: uploading });
  }, [dispatch]);
  
  /**
   * 设置上传进度
   */
  const setUploadProgress = useCallback((progress: number) => {
    dispatch({ type: 'SET_UPLOAD_PROGRESS', payload: progress });
  }, [dispatch]);
  
  /**
   * 设置上传错误
   */
  const setUploadError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_UPLOAD_ERROR', payload: error });
  }, [dispatch]);
  
  /**
   * 设置当前上传文件
   */
  const setCurrentFiles = useCallback((files: File[]) => {
    dispatch({ type: 'SET_CURRENT_FILES', payload: files });
  }, [dispatch]);
  
  /**
   * 设置已上传文件
   */
  const setUploadedFiles = useCallback((files: FileInfo[]) => {
    dispatch({ type: 'SET_UPLOADED_FILES', payload: files });
  }, [dispatch]);
  
  /**
   * 清除上传状态
   */
  const clearUploadState = useCallback(() => {
    dispatch({ type: 'CLEAR_UPLOAD_STATE', payload: undefined });
  }, [dispatch]);
  
  /**
   * 处理文件上传
   */
  const handleUpload = useCallback(async (files: File[], folderId: string | null = currentFolderId) => {
    if (!files.length) {
      message.warning('请选择要上传的文件');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setCurrentFiles(files);
    
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
      
      // 上传成功后刷新文件列表
      await loadFiles(folderId);
      
      // 关闭上传UI相关模态框和状态
      dispatch({ type: 'SET_UPLOAD_MODAL_OPEN', payload: false });
      dispatch({ type: 'SET_FOLDER_UPLOAD_MODAL_OPEN', payload: false });
      
      // 清除上传状态
      clearUploadState();
      
      return true;
    } catch (error) {
      console.error('上传文件错误:', error);
      setUploadError(error instanceof Error ? error.message : '上传失败，请重试');
      message.error(error instanceof Error ? error.message : '上传失败，请重试');
      return false;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [
    currentFolderId, 
    setIsUploading, 
    setUploadProgress, 
    setUploadError, 
    setCurrentFiles, 
    clearUploadState, 
    loadFiles, 
    dispatch
  ]);

  /**
   * 处理文件夹上传
   */
  const handleFolderUpload = useCallback(async (folderItems: FileSystemEntry[], folderId: string | null = currentFolderId) => {
    if (!folderItems.length) {
      message.warning('请选择要上传的文件夹');
      return;
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
      
      const rawFiles = allFiles.map(item => item.file);
      setCurrentFiles(rawFiles);

      // 上传所有文件及其路径信息
      const formData = new FormData();
      
      allFiles.forEach(({ file, path }, index) => {
        formData.append('file', file);
        formData.append('paths', path);
      });
      
      // 添加目标文件夹ID（如果有）
      if (folderId) {
        formData.append('folderId', folderId);
      }
      
      // 标记为文件夹上传
      formData.append('isFolderUpload', 'true');
      
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
              message.success(`成功上传文件夹，包含 ${allFiles.length} 个文件`);
              resolve();
            } else {
              reject(new Error(response.error || '上传文件夹失败'));
            }
          } else {
            reject(new Error('上传文件夹失败，服务器返回错误'));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('网络错误，上传文件夹失败'));
        };
        
        xhr.send(formData);
      });
      
      // 上传成功后刷新文件列表
      await loadFiles(folderId);
      
      // 关闭上传UI相关模态框和状态
      dispatch({ type: 'SET_UPLOAD_MODAL_OPEN', payload: false });
      dispatch({ type: 'SET_FOLDER_UPLOAD_MODAL_OPEN', payload: false });
      
      // 清除上传状态
      clearUploadState();
      
      return true;
    } catch (error) {
      console.error('上传文件夹错误:', error);
      setUploadError(error instanceof Error ? error.message : '上传文件夹失败，请重试');
      message.error(error instanceof Error ? error.message : '上传文件夹失败，请重试');
      return false;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [
    currentFolderId, 
    setIsUploading, 
    setUploadProgress, 
    setUploadError, 
    setCurrentFiles, 
    clearUploadState, 
    loadFiles, 
    dispatch
  ]);

  return {
    // 状态
    isUploading,
    uploadProgress,
    uploadError,
    currentFiles,
    
    // 操作
    handleUpload,
    handleFolderUpload,
    
    // 状态设置
    setIsUploading,
    setUploadProgress,
    setUploadError,
    clearUploadState
  };
}; 