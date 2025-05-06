import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { FileInfo } from '@/app/types';
import { downloadFile, downloadFolder, downloadBlob, downloadFileDirect, downloadMultipleFiles } from '@/app/lib/storage/utils/download';
import { handleError } from '@/app/utils/error';
import useFileStore from '@/app/store/fileStore';
import { API_PATHS } from '@/app/lib/api/paths';
import { fileApi } from '@/app/lib/api/file-api';

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
  downloadFiles: (fileIds: string[], customFileName?: string) => Promise<boolean>;
  /** 移动文件 */
  moveFiles: (fileIds: string[], targetFolderId: string) => Promise<boolean>;
  /** 删除文件 */
  deleteFiles: (fileIds: string[], onSuccess?: () => void) => Promise<boolean>;
  /** 重命名文件 */
  renameFile: (fileId: string, newName: string, onSuccess?: (updatedFile: FileInfo) => void) => Promise<boolean>;
  /** 创建文件夹 */
  createFolder: (name: string, parentId: string | null, tags?: string[]) => Promise<string | null>;
  /** 获取文件信息 */
  getFilesInfo: (fileIds: string[]) => Promise<FileInfo[]>;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;
}

/**
 * 记录文件下载历史
 * @param fileId 文件ID
 */
const recordFileDownload = async (fileId: string): Promise<void> => {
  try {
    await fetch(API_PATHS.STORAGE.DOWNLOADS.RECORD, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId }),
    });
  } catch (error) {
    console.warn('记录下载历史失败:', error);
    // 忽略错误，不影响用户体验
  }
};

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
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
  
  // 尝试从localStorage获取当前用户ID
  useEffect(() => {
    try {
      const userJSON = localStorage.getItem('user');
      if (userJSON) {
        const user = JSON.parse(userJSON);
        if (user && user.id) {
          setCurrentUserId(user.id);
        }
      }
    } catch (e) {
      console.error('无法获取当前用户ID:', e);
    }
  }, []);
  
  // 如果Zustand中还没有选择的文件，则使用传入的初始选择
  useEffect(() => {
    if (selectedFileIds.length === 0 && initialSelectedIds.length > 0) {
      storeSelectFiles(initialSelectedIds);
    }
  }, [initialSelectedIds, selectedFileIds.length, storeSelectFiles]);

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
   * @param customFileName 自定义文件名
   * @returns 是否成功
   */
  const downloadFiles = useCallback(async (fileIds: string[], customFileName?: string): Promise<boolean> => {
    if (!fileIds.length) {
      message.warning('请选择要下载的文件');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log(`开始下载文件: ${fileIds.join(', ')}`);
      
      // 单个文件下载 - 判断是文件夹还是普通文件
      if (fileIds.length === 1) {
        try {
          // 获取文件信息
          const fileInfo = await fileApi.getFile(fileIds[0]);
          
          if (!fileInfo) {
            throw new Error('无法获取文件信息');
          }
          
          let success = false;
          
          // 如果提供了自定义文件名，使用它；否则使用原始文件名
          const fileName = customFileName || fileInfo.name;
          
          if (fileInfo.isFolder) {
            // 文件夹下载 - 使用ZIP打包
            console.log(`下载文件夹: ${fileInfo.name}`);
            success = await downloadFolder(fileIds[0], fileName);
          } else {
            // 普通文件下载 - 优先使用直接下载API
            console.log(`下载文件: ${fileInfo.name}`);
            try {
              // 尝试直接下载
              success = await downloadFileDirect(fileIds[0], fileName);
            } catch (directError) {
              console.warn('直接下载失败，尝试ZIP下载:', directError);
              // 如果直接下载失败，回退到ZIP下载
              success = await downloadFile(fileIds[0], fileName);
            }
          }
          
          // 记录下载历史并返回结果
          if (success) {
            await recordFileDownload(fileIds[0]);
            return true;
          }
        } catch (error) {
          console.error('单文件下载处理失败:', error);
          // 出错时继续执行到多文件下载逻辑
        }
      }
      
      // 多文件下载或单文件处理失败时的逻辑
      try {
        // 使用专门的多文件下载函数处理，传递自定义文件名
        const success = await downloadMultipleFiles(fileIds, customFileName);
        
        // 下载成功后，记录所有文件的下载历史
        if (success) {
          // 为每个文件记录下载历史
          for (const fileId of fileIds) {
            await recordFileDownload(fileId);
          }
        }
        
        return success;
      } catch (error) {
        console.error('多文件下载失败:', error);
        return false;
      }
    } catch (error) {
      handleError(error, true, 'error', '下载文件失败');
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
      handleError(error, true, 'error', '移动文件失败');
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
      handleError(error, true, 'error', '删除文件失败');
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
      
      if (!currentUserId) {
        throw new Error('未找到用户ID');
      }
      
      // 使用API重命名文件
      const response = await fetch(API_PATHS.STORAGE.FILES.RENAME(fileId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '重命名文件失败');
      }
      
      const updatedFile = await response.json();
      
      // 更新Zustand状态
      storeRenameFile(fileId, newName);
      
      message.success('文件重命名成功');
      if (onSuccess && updatedFile) {
        onSuccess(updatedFile);
      }
      return true;
    } catch (error) {
      handleError(error, true, 'error', '重命名文件失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, storeRenameFile]);

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
      handleError(error, true, 'error', '创建文件夹失败');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [storeCreateFolder]);

  /**
   * 获取多个文件的详细信息
   * @param fileIds 文件ID列表
   * @returns 包含文件详细信息的Promise
   */
  const getFilesInfo = useCallback(async (fileIds: string[]): Promise<FileInfo[]> => {
    if (!fileIds.length) return [];
    
    try {
      setIsLoading(true);
      setError(null);
      
      // 使用fileApi获取文件信息，而不是FileManagementService
      const filesInfoPromises = fileIds.map(fileId => 
        fileApi.getFile(fileId)
      );
      
      const filesInfo = await Promise.all(filesInfoPromises);
      // 过滤掉可能的null结果
      return filesInfo.filter(Boolean) as FileInfo[];
    } catch (error) {
      console.error('获取文件信息失败:', error);
      setError('获取文件信息失败');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    getFilesInfo,
    isLoading,
    error
  };
}; 