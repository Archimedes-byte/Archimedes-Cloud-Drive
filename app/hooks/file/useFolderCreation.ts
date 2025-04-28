import { useState, useCallback } from 'react';
import { message } from 'antd';
import { fileApi } from '@/app/lib/api/file-api';

/**
 * 文件夹创建hook接口
 */
export interface FolderCreationHook {
  // 状态
  /** 创建文件夹模态窗口是否打开 */
  isCreateFolderModalOpen: boolean;
  /** 是否正在提交 */
  isCreating: boolean;
  /** 错误信息 */
  error: string | null;
  
  // 方法
  /** 打开创建文件夹模态窗口 */
  openCreateFolderModal: () => void;
  /** 关闭创建文件夹模态窗口 */
  closeCreateFolderModal: () => void;
  /** 创建文件夹 */
  createFolder: (name: string, parentId: string | null, tags?: string[]) => Promise<string | null>;
}

/**
 * 文件夹创建hook
 * 管理文件夹创建相关状态和操作
 * 
 * @returns 文件夹创建hook接口
 */
export function useFolderCreation(): FolderCreationHook {
  // 创建文件夹模态窗口状态
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 打开创建文件夹模态窗口
   */
  const openCreateFolderModal = useCallback(() => {
    setIsCreateFolderModalOpen(true);
    setError(null);
  }, []);

  /**
   * 关闭创建文件夹模态窗口
   */
  const closeCreateFolderModal = useCallback(() => {
    setIsCreateFolderModalOpen(false);
  }, []);

  /**
   * 创建文件夹
   * @param name 文件夹名称
   * @param parentId 父文件夹ID，null表示根目录
   * @param tags 标签列表
   * @returns 创建的文件夹ID，失败返回null
   */
  const createFolder = useCallback(async (
    name: string,
    parentId: string | null,
    tags: string[] = []
  ): Promise<string | null> => {
    if (!name.trim()) {
      setError('文件夹名称不能为空');
      return null;
    }

    // 检查特殊字符
    const invalidChars = /[\/\\:*?"<>|]/;
    if (invalidChars.test(name)) {
      setError('文件夹名称不能包含下列字符: / \\ : * ? " < > |');
      return null;
    }

    setError(null);
    setIsCreating(true);

    try {
      // 调用API创建文件夹
      const response = await fileApi.createFolder(name.trim(), parentId, tags);
      
      if (response && response.id) {
        message.success('文件夹创建成功');
        // 创建成功后关闭模态窗口
        closeCreateFolderModal();
        return response.id;
      } else {
        throw new Error('创建文件夹失败，服务器未返回有效数据');
      }
    } catch (error) {
      console.error('创建文件夹失败:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : '创建文件夹失败，请重试';
      
      if (errorMessage.includes('已存在') || errorMessage.includes('同名')) {
        setError('同一目录下已存在同名文件夹，请使用其他名称');
        message.warning('文件夹名称已存在，请使用其他名称');
      } else {
        setError(errorMessage);
        message.error(errorMessage);
      }
      
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [closeCreateFolderModal]);

  return {
    // 状态
    isCreateFolderModalOpen,
    isCreating,
    error,
    
    // 方法
    openCreateFolderModal,
    closeCreateFolderModal,
    createFolder
  };
} 