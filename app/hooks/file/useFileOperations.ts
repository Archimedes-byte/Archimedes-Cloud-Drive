import { useState, useCallback } from 'react';
import { message } from 'antd';
import { FileWithSize } from './useFiles';

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
        window.open(`/api/files/download?fileId=${fileIds[0]}`, '_blank');
        return true;
      }

      // 处理多文件下载 (压缩包)
      const queryParams = new URLSearchParams();
      fileIds.forEach(id => queryParams.append('fileIds', id));
      
      window.open(`/api/files/download-batch?${queryParams.toString()}`, '_blank');
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

      const response = await fetch('/api/files/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileIds,
          targetFolderId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '移动文件失败');
      }

      if (data.success) {
        message.success('文件移动成功');
        return true;
      } else {
        throw new Error(data.error || '移动文件失败');
      }
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

      const response = await fetch('/api/files', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileIds }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '删除文件失败');
      }

      if (data.success) {
        message.success('文件删除成功');
        // 清除已删除文件的选择
        setSelectedFileIds(prev => prev.filter(id => !fileIds.includes(id)));
        return true;
      } else {
        throw new Error(data.error || '删除文件失败');
      }
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

      const response = await fetch(`/api/files/${fileId}/rename`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newName: newName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '重命名文件失败');
      }

      if (data.success) {
        message.success('文件重命名成功');
        return true;
      } else {
        throw new Error(data.error || '重命名文件失败');
      }
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
   * @returns 新文件夹ID，创建失败返回null
   */
  const createFolder = useCallback(async (name: string, parentId: string | null, tags: string[] = []): Promise<string | null> => {
    // 先检查name是否为null或undefined
    if (!name || typeof name !== 'string') {
      message.warning('文件夹名称不能为空');
      return null;
    }
    
    // 检查trim后的结果
    if (!name.trim()) {
      message.warning('文件夹名称不能为空');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // 构建请求数据
      const requestData = {
        name: name.trim(),
        parentId,
        tags: tags || [],
      };
      
      console.log('创建文件夹请求数据:', requestData);

      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      console.log('创建文件夹API响应:', data);

      if (!response.ok) {
        const errorMsg = data.error || `服务器返回错误状态码: ${response.status}`;
        console.error('创建文件夹失败 - 服务器错误:', errorMsg);
        throw new Error(errorMsg);
      }

      // 更健壮的响应处理
      if (data.success === true) {
        // 服务器表示成功
        if (data.folder && data.folder.id) {
          // 标准响应：包含完整的文件夹对象和ID
          message.success('文件夹创建成功');
          return data.folder.id;
        } else if (data.data && data.data.id) {
          // API实际上使用data字段返回文件夹信息
          message.success('文件夹创建成功');
          return data.data.id;
        } else if (data.folderId) {
          // 备选响应格式：直接包含folderId字段
          message.success('文件夹创建成功');
          return data.folderId;
        } else if (data.id) {
          // 备选响应格式：直接包含id字段
          message.success('文件夹创建成功');
          return data.id;
        } else {
          // 虽然标记为成功，但没有返回有效ID
          console.error('创建文件夹数据不完整:', data);
          message.success('文件夹创建成功，但无法获取文件夹ID');
          // 返回一个非空值以表示成功
          return 'unknown-id';
        }
      } else {
        // 服务器明确表示失败
        const errorMsg = data.error || '创建文件夹失败: 服务器拒绝请求';
        console.error('创建文件夹被服务器拒绝:', errorMsg);
        throw new Error(errorMsg);
      }
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