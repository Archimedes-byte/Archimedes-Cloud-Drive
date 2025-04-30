import { useState, useCallback } from 'react';
import { message } from 'antd';
import { FileWithSize } from './useFiles';
import { API_PATHS } from '@/app/lib/api/paths';
import { fileApi } from '@/app/lib/api/file-api';
import { FileInfo } from '@/app/types';
import { downloadFile, downloadFolder } from '@/app/lib/storage/utils/download';
import { handleApiError, downloadFileHelper, downloadFolderHelper } from '@/app/lib/file/fileUtils';
import useFileStore from '@/app/store/fileStore';

/**
 * 文件操作接口
 */
export interface FileOperations {
  /** 选择文件ID列表 */
  selectedFileIds: string[];
  /** 选择文件 */
  selectFile: (fileId: string, selected: boolean) => void;
  /** 选择多个文件 */
  selectFiles: (fileIds: string[]) => void;
  /** 清除选择 */
  clearSelection: () => void;
  /** 下载文件 */
  downloadFiles: (fileIds: string[]) => Promise<boolean>;
  /** 移动文件 */
  moveFiles: (fileIds: string[], targetFolderId: string) => Promise<boolean>;
  /** 删除文件 */
  deleteFiles: (fileIds: string[], onSuccess?: () => void) => Promise<boolean>;
  /** 重命名文件 */
  renameFile: (fileId: string, newName: string, onSuccess?: (updatedFile: FileInfo) => void) => Promise<boolean>;
  /** 创建文件夹 */
  createFolder: (name: string, parentId: string | null, tags?: string[]) => Promise<string | null>;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;
}

/**
 * 文件操作钩子
 * 提供文件操作相关的方法
 * 
 * @param initialSelectedIds 初始选中的文件ID
 * @returns 文件操作接口
 */
export const useFileOperations = (initialSelectedIds: string[] = []): FileOperations => {
  // 本地状态
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 使用全局Zustand状态
  const { 
    selectedFileIds, 
    selectFile: storeSelectFile,
    selectFiles: storeSelectFiles,
    clearSelection: storeClearSelection,
    deleteFiles: storeDeleteFiles,
    moveFiles: storeMoveFiles,
    renameFile: storeRenameFile,
    createFolder: storeCreateFolder
  } = useFileStore();
  
  // 如果Zustand中还没有选择的文件，则使用传入的初始选择
  useState(() => {
    if (selectedFileIds.length === 0 && initialSelectedIds.length > 0) {
      storeSelectFiles(initialSelectedIds);
    }
  });

  /**
   * 选择文件
   * @param fileId 文件ID
   * @param selected 是否选中
   */
  const selectFile = useCallback((fileId: string, selected: boolean) => {
    storeSelectFile(fileId, selected);
  }, [storeSelectFile]);

  /**
   * 选择多个文件
   * @param fileIds 文件ID列表
   */
  const selectFiles = useCallback((fileIds: string[]) => {
    storeSelectFiles(fileIds);
  }, [storeSelectFiles]);

  /**
   * 清除选择
   */
  const clearSelection = useCallback(() => {
    storeClearSelection();
  }, [storeClearSelection]);

  /**
   * 下载文件
   * @param fileIds 文件ID列表
   * @returns 是否成功
   */
  const downloadFiles = useCallback(async (fileIds: string[]): Promise<boolean> => {
    if (!fileIds.length) {
      message.warning('请选择要下载的文件');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log(`开始下载文件: ${fileIds.join(', ')}`);
      let success = false;
      
      // 如果是单个文件夹，使用文件夹下载功能
      if (fileIds.length === 1) {
        try {
          const fileInfo = await fileApi.getFile(fileIds[0]);
          if (fileInfo && fileInfo.isFolder) {
            console.log(`检测到文件夹下载: ${fileInfo.name}`);
            // 使用改进的文件夹下载函数
            success = await downloadFolderHelper(fileIds[0], fileInfo.name);
            
            if (success) {
              // 记录下载历史
              try {
                await fileApi.recordFileDownload(fileIds[0]);
              } catch (error) {
                console.warn('记录下载历史失败:', error);
                // 但不影响下载成功的状态
              }
              
              return true;
            }
          } else if (fileInfo) {
            // 如果是单个文件，使用文件下载函数
            // 修复API路径问题并使用正确的请求方法
            // 使用与多文件下载相同的API路径和请求方式
            const downloadUrl = `${API_PATHS.STORAGE.FILES.DOWNLOAD}?_t=${Date.now()}`;
            console.log('单个文件下载URL:', downloadUrl, '文件名:', fileInfo.name);
            
            // 添加错误处理和重试
            let retryCount = 0;
            const maxRetries = 2;
            while (retryCount <= maxRetries) {
              try {
                // 直接使用fetch实现单文件POST下载
                const response = await fetch(downloadUrl, {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                  },
                  body: JSON.stringify({ fileIds: [fileInfo.id] }),
                  credentials: 'include'
                });
                
                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  console.error('下载请求失败:', response.status, errorData);
                  throw new Error(errorData.error || `下载失败 (${response.status})`);
                }
                
                // 获取文件名
                const contentDisposition = response.headers.get('Content-Disposition') || '';
                let fileName = fileInfo.name;
                
                // 尝试从响应头中提取文件名
                const filenameMatch = contentDisposition.match(/filename="?(.+?)"?(?:;|$)/);
                if (filenameMatch && filenameMatch[1]) {
                  fileName = decodeURIComponent(filenameMatch[1]);
                }
                
                // 获取内容类型
                const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
                
                // 获取blob
                const blob = await response.blob();
                
                // 验证blob
                if (!blob || blob.size === 0) {
                  throw new Error('获取到的文件内容为空');
                }
                
                console.log('获取到单文件blob:', blob.size, 'bytes, 类型:', contentType, '文件名:', fileName);
                
                // 使用通用下载工具
                success = await downloadFileHelper('', fileName, contentType, blob);
                if (success) break;
              } catch (downloadError) {
                console.warn(`文件下载尝试 ${retryCount + 1}/${maxRetries + 1} 失败:`, downloadError);
                // 如果是405错误，说明API请求方法有问题，直接跳出循环尝试多文件下载API
                if ((downloadError as any)?.message?.includes('405')) {
                  console.warn('检测到405错误，尝试切换到多文件下载方式');
                  break;
                }
                if (retryCount >= maxRetries) break;
                // 等待一秒后重试
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
              retryCount++;
            }
            
            if (success) {
              try {
                await fileApi.recordFileDownload(fileIds[0]);
              } catch (recordError) {
                console.warn('记录下载历史失败:', recordError);
              }
              return true;
            }
          }
        } catch (error) {
          console.warn('获取单个文件信息失败，尝试通用下载方式', error);
        }
      }
      
      // 对于多文件下载或者单文件下载失败的情况
      if (!success) {
        try {
          // 构建下载URL
          const downloadUrl = `${API_PATHS.STORAGE.FILES.DOWNLOAD}?_t=${Date.now()}`;
          console.log('多文件下载URL:', downloadUrl, '文件IDs:', fileIds);
          
          // 添加加载提示
          message.loading({ content: '准备下载文件中...', key: 'fileMultiDownload' });
          
          // 使用 fetch 获取 blob 数据
          const response = await fetch(downloadUrl, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            },
            body: JSON.stringify({ fileIds }),
            // 确保包含凭证
            credentials: 'include'
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('下载请求失败:', response.status, errorData);
            // 更新加载状态
            message.error({ content: `下载请求失败 (${response.status})`, key: 'fileMultiDownload' });
            throw new Error(errorData.error || `下载失败 (${response.status})`);
          }
          
          // 获取文件名
          const contentDisposition = response.headers.get('Content-Disposition') || '';
          let fileName = '下载文件';
          
          // 尝试从响应头中提取文件名
          const filenameMatch = contentDisposition.match(/filename="?(.+?)"?(?:;|$)/);
          if (filenameMatch && filenameMatch[1]) {
            fileName = decodeURIComponent(filenameMatch[1]);
          } else if (fileIds.length > 1) {
            fileName = '多文件下载.zip';
          }
          
          // 获取内容类型
          const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
          
          // 获取blob
          const blob = await response.blob();
          
          // 验证blob
          if (!blob || blob.size === 0) {
            message.error({ content: '获取到的文件内容为空', key: 'fileMultiDownload' });
            throw new Error('获取到的文件内容为空');
          }
          
          console.log('获取到blob:', blob.size, 'bytes, 类型:', contentType, '文件名:', fileName);
          
          // 使用通用下载工具
          success = await downloadFileHelper('', fileName, contentType, blob);
          
          // 记录下载历史
          if (success && fileIds.length === 1) {
            try {
              await fileApi.recordFileDownload(fileIds[0]);
            } catch (recordError) {
              console.warn('记录下载历史失败:', recordError);
            }
          }
        } catch (error) {
          console.error('下载文件详细错误:', error);
          handleApiError(error, '下载文件失败');
          return false;
        }
      }
      
      return success;
    } catch (error) {
      handleApiError(error, '下载文件失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 移动文件
   * @param fileIds 文件ID列表
   * @param targetFolderId 目标文件夹ID
   * @returns 是否成功
   */
  const moveFiles = useCallback(async (fileIds: string[], targetFolderId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 使用Zustand中的移动文件功能
      const success = await storeMoveFiles(fileIds, targetFolderId);
      
      if (success) {
        message.success('文件移动成功');
      }
      
      return success;
    } catch (error) {
      handleApiError(error, '移动文件失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [storeMoveFiles]);

  /**
   * 删除文件
   * @param fileIds 要删除的文件ID列表
   * @param onSuccess 成功回调
   * @returns 是否成功
   */
  const deleteFiles = useCallback(async (fileIds: string[], onSuccess?: () => void): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 使用Zustand中的删除文件功能
      const success = await storeDeleteFiles(fileIds, onSuccess);
      
      if (success) {
        message.success('文件删除成功');
      }
      
      return success;
    } catch (error) {
      handleApiError(error, '删除文件失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [storeDeleteFiles]);

  /**
   * 重命名文件
   * @param fileId 文件ID
   * @param newName 新名称
   * @param onSuccess 成功回调
   * @returns 是否成功
   */
  const renameFile = useCallback(async (
    fileId: string, 
    newName: string, 
    onSuccess?: (updatedFile: FileInfo) => void
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 使用Zustand中的重命名文件功能
      const updatedFile = await storeRenameFile(fileId, newName);
      
      if (updatedFile) {
        message.success('文件重命名成功');
        if (onSuccess) {
          onSuccess(updatedFile);
        }
        return true;
      }
      
      return false;
    } catch (error) {
      handleApiError(error, '重命名文件失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [storeRenameFile]);

  /**
   * 创建文件夹
   * @param name 文件夹名称
   * @param parentId 父文件夹ID
   * @param tags 标签
   * @returns 创建的文件夹ID或null
   */
  const createFolder = useCallback(async (
    name: string, 
    parentId: string | null, 
    tags: string[] = []
  ): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 使用Zustand中的创建文件夹功能
      const folderId = await storeCreateFolder(name, parentId, tags);
      
      if (folderId) {
        message.success(`文件夹 "${name}" 创建成功`);
      }
      
      return folderId;
    } catch (error) {
      handleApiError(error, '创建文件夹失败');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [storeCreateFolder]);

  return {
    selectedFileIds,
    selectFile,
    selectFiles,
    clearSelection,
    downloadFiles,
    moveFiles,
    deleteFiles,
    renameFile,
    createFolder,
    isLoading,
    error
  };
}; 