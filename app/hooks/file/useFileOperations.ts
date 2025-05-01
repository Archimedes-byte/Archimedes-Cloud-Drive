import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { FileInfo } from '@/app/types';
import { downloadFile, downloadFolder, downloadBlob } from '@/app/lib/storage/utils/download';
import { handleError } from '@/app/utils/error';
import useFileStore from '@/app/store/fileStore';
import { FileManagementService } from '@/app/services/storage';
import { API_PATHS } from '@/app/lib/api/paths';

// 创建服务实例
const fileManagementService = new FileManagementService();

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
      
      // 如果是单个文件
      if (fileIds.length === 1) {
        try {
          // 获取文件信息，以确定是文件还是文件夹
          const fileInfo = await fileManagementService.getFile(currentUserId || '', fileIds[0]);
          
          if (fileInfo && fileInfo.isFolder) {
            console.log(`检测到文件夹下载: ${fileInfo.name}`);
            // 使用文件夹下载函数
            success = await downloadFolder(fileIds[0], fileInfo.name);
          } else if (fileInfo) {
            // 使用文件下载函数
            success = await downloadFile(fileIds[0], fileInfo.name);
          }
          
          // 如果下载成功，记录下载历史
          if (success) {
            await recordFileDownload(fileIds[0]);
            return true;
          }
        } catch (error) {
          console.warn('获取单个文件信息失败，尝试直接下载', error);
          // 如果获取文件信息失败，尝试直接下载
          success = await downloadFile(fileIds[0]);
          if (success) return true;
        }
      }
      
      // 对于多文件下载或单文件下载失败的情况
      if (!success && fileIds.length > 0) {
        try {
          message.loading({ content: '准备下载文件中...', key: 'fileMultiDownload' });
          
          // 构建POST请求获取文件Blob
          const response = await fetch('/api/storage/files/download', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fileIds }),
          });
          
          if (!response.ok) {
            throw new Error(`下载请求失败: ${response.status}`);
          }
          
          // 获取blob
          const blob = await response.blob();
          
          // 验证blob
          if (!blob || blob.size === 0) {
            message.error({ content: '获取到的文件内容为空', key: 'fileMultiDownload' });
            throw new Error('获取到的文件内容为空');
          }
          
          // 确定下载文件名
          let fileName = fileIds.length > 1 ? '多文件下载.zip' : '下载文件';
          success = await downloadBlob(blob, fileName);
          
          // 成功下载后显示消息
          if (success) {
            message.success({ content: '下载成功', key: 'fileMultiDownload' });
            
            // 记录下载历史 (只在单文件下载时记录)
            if (fileIds.length === 1) {
              await recordFileDownload(fileIds[0]);
            }
          }
        } catch (error) {
          console.error('下载文件详细错误:', error);
          handleError(error, true, 'error', '下载文件失败');
          return false;
        }
      }
      
      return success;
    } catch (error) {
      handleError(error, true, 'error', '下载文件失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

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
      
      // 使用FileManagementService的重命名功能
      const updatedFile = await fileManagementService.renameFile(currentUserId, fileId, newName);
      
      // 更新Zustand状态
      storeRenameFile(fileId, newName);
      
      message.success('文件重命名成功');
      if (onSuccess) {
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
    if (!fileIds.length || !currentUserId) return [];
    
    try {
      setIsLoading(true);
      setError(null);
      
      // 并行请求所有文件信息
      const filesInfoPromises = fileIds.map(fileId => 
        fileManagementService.getFile(currentUserId, fileId)
      );
      
      const filesInfo = await Promise.all(filesInfoPromises);
      return filesInfo;
    } catch (error) {
      console.error('获取文件信息失败:', error);
      setError('获取文件信息失败');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

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