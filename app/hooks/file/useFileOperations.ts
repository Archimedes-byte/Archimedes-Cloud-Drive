import { useState, useCallback } from 'react';
import { message } from 'antd';
import { FileWithSize } from './useFiles';
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
  downloadFiles: (fileIds: string[]) => Promise<boolean>;
  /** 移动文件 */
  moveFiles: (fileIds: string[], targetFolderId: string) => Promise<boolean>;
  /** 删除文件 */
  deleteFiles: (fileIds: string[]) => Promise<boolean>;
  /** 重命名文件 */
  renameFile: (fileId: string, newName: string) => Promise<boolean>;
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
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>(initialSelectedIds);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 选择文件
   * @param fileId 文件ID
   * @param selected 是否选中
   */
  const selectFile = useCallback((fileId: string, selected: boolean) => {
    setSelectedFileIds(prev => {
      if (selected) {
        if (prev.includes(fileId)) {
          return prev;
        }
        return [...prev, fileId];
      } else {
        return prev.filter(id => id !== fileId);
      }
    });
  }, []);

  /**
   * 选择多个文件
   * @param fileIds 文件ID列表
   */
  const selectFiles = useCallback((fileIds: string[]) => {
    setSelectedFileIds(fileIds);
  }, []);

  /**
   * 清除选择
   */
  const clearSelection = useCallback(() => {
    setSelectedFileIds([]);
  }, []);

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

      // 处理单文件下载
      if (fileIds.length === 1) {
        window.open(`${API_PATHS.STORAGE.FILES.DOWNLOAD}?fileId=${fileIds[0]}`, '_blank');
        return true;
      }

      // 处理多文件下载 (压缩包)
      const queryParams = new URLSearchParams();
      fileIds.forEach(id => queryParams.append('fileIds', id));
      
      window.open(`${API_PATHS.STORAGE.FILES.DOWNLOAD}-batch?${queryParams.toString()}`, '_blank');
      return true;
    } catch (error) {
      console.error('下载文件失败:', error);
      setError(error instanceof Error ? error.message : '下载失败');
      message.error('下载文件失败，请重试');
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
    if (!fileIds.length) {
      message.warning('请选择要移动的文件');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 使用fileApi客户端
      await fileApi.moveFiles(fileIds, targetFolderId);
      message.success('文件移动成功');
      return true;
    } catch (error) {
      console.error('移动文件失败:', error);
      setError(error instanceof Error ? error.message : '移动失败');
      message.error(error instanceof Error ? error.message : '移动文件失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 删除文件
   * @param fileIds 文件ID列表
   * @returns 是否成功
   */
  const deleteFiles = useCallback(async (fileIds: string[]): Promise<boolean> => {
    if (!fileIds.length) {
      message.warning('请选择要删除的文件');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 使用fileApi客户端
      await fileApi.deleteFiles(fileIds);
      message.success('文件删除成功');
      // 清除已删除文件的选择
      setSelectedFileIds(prev => prev.filter(id => !fileIds.includes(id)));
      return true;
    } catch (error) {
      console.error('删除文件失败:', error);
      setError(error instanceof Error ? error.message : '删除失败');
      message.error(error instanceof Error ? error.message : '删除文件失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 重命名文件
   * @param fileId 文件ID
   * @param newName 新文件名
   * @returns 是否成功
   */
  const renameFile = useCallback(async (fileId: string, newName: string): Promise<boolean> => {
    // 检查fileId和newName的有效性
    if (!fileId) {
      message.warning('文件ID不能为空');
      return false;
    }
    
    // 检查newName的类型和值
    if (!newName || typeof newName !== 'string') {
      message.warning('新文件名不能为空且必须是字符串');
      return false;
    }
    
    // 检查trim后的newName是否为空
    if (!newName.trim()) {
      message.warning('新文件名不能为空');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 使用fileApi客户端
      await fileApi.updateFile(fileId, newName.trim());
      message.success('文件重命名成功');
      return true;
    } catch (error) {
      console.error('重命名文件失败:', error);
      setError(error instanceof Error ? error.message : '重命名失败');
      message.error(error instanceof Error ? error.message : '重命名文件失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 创建文件夹
   * @param name 文件夹名称
   * @param parentId 父文件夹ID
   * @param tags 标签列表
   * @returns 文件夹ID (如果创建成功)
   */
  const createFolder = useCallback(async (
    name: string, 
    parentId: string | null = null,
    tags: string[] = []
  ): Promise<string | null> => {
    if (!name || !name.trim()) {
      message.warning('文件夹名称不能为空');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 使用fileApi客户端
      const folder = await fileApi.createFolder(name.trim(), parentId, tags);
      message.success('文件夹创建成功');
      return folder.id;
    } catch (error) {
      console.error('创建文件夹过程中出错:', error);
      setError(error instanceof Error ? error.message : '创建失败');
      message.error(error instanceof Error ? error.message : '创建文件夹失败，请重试');
      return null;
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
    isLoading,
    error
  };
}; 