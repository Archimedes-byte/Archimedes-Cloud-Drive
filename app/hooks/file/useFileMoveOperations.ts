import { useState, useCallback } from 'react';
import { message } from 'antd';
import { fileApi } from '@/app/lib/api/file-api';
import { FileInfo } from '@/app/types';

/**
 * 文件移动操作钩子接口
 */
export interface FileMoveOperationsHook {
  /** 是否正在移动文件 */
  isMoveLoading: boolean;
  /** 设置是否正在移动文件 */
  setIsMoveLoading: (loading: boolean) => void;
  /** 移动模态窗口是否打开 */
  isMoveModalOpen: boolean;
  /** 设置移动模态窗口状态 */
  setIsMoveModalOpen: (open: boolean) => void;
  /** 打开移动模态窗口 */
  openMoveModal: () => void;
  /** 关闭移动模态窗口 */
  closeMoveModal: () => void;
  /** 禁用的文件夹ID列表（不能作为移动目标） */
  disabledFolderIds: string[];
  /** 更新禁用的文件夹ID列表 */
  updateDisabledFolderIds: (files: FileInfo[]) => void;
  /** 执行文件移动 */
  moveFiles: (fileIds: string[], targetFolderId: string, onSuccess?: () => void) => Promise<boolean>;
}

/**
 * 文件移动操作钩子
 * 提供文件移动相关功能和状态管理
 * 
 * @returns 文件移动相关状态和方法
 */
export const useFileMoveOperations = (): FileMoveOperationsHook => {
  // 移动相关状态
  const [isMoveLoading, setIsMoveLoading] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [disabledFolderIds, setDisabledFolderIds] = useState<string[]>([]);

  /**
   * 打开移动模态窗口
   */
  const openMoveModal = useCallback(() => {
    setIsMoveModalOpen(true);
  }, []);

  /**
   * 关闭移动模态窗口
   */
  const closeMoveModal = useCallback(() => {
    setIsMoveModalOpen(false);
  }, []);

  /**
   * 更新禁用的文件夹ID列表
   * @param files 文件列表
   */
  const updateDisabledFolderIds = useCallback((files: FileInfo[]) => {
    // 获取所有被选中的文件夹ID，这些文件夹不能作为移动目标
    const folderIds = files
      .filter(file => file.isFolder)
      .map(folder => folder.id);
    
    setDisabledFolderIds(folderIds);
  }, []);

  /**
   * 执行文件移动
   * @param fileIds 要移动的文件ID列表
   * @param targetFolderId 目标文件夹ID
   * @param onSuccess 成功回调
   * @returns 是否成功
   */
  const moveFiles = useCallback(async (
    fileIds: string[], 
    targetFolderId: string,
    onSuccess?: () => void
  ): Promise<boolean> => {
    if (fileIds.length === 0) {
      message.warning('请选择要移动的文件');
      return false;
    }

    setIsMoveLoading(true);

    try {
      // 使用fileApi客户端执行文件移动
      await fileApi.moveFiles(fileIds, targetFolderId);
      
      // 成功后关闭模态窗口
      closeMoveModal();
      
      message.success('文件移动成功');
      
      // 调用成功回调
      if (onSuccess) {
        onSuccess();
      }
      
      return true;
    } catch (error) {
      console.error('移动文件失败:', error);
      message.error(error instanceof Error ? error.message : '移动文件失败，请重试');
      return false;
    } finally {
      setIsMoveLoading(false);
    }
  }, [closeMoveModal]);

  return {
    isMoveLoading,
    setIsMoveLoading,
    isMoveModalOpen,
    setIsMoveModalOpen,
    openMoveModal,
    closeMoveModal,
    disabledFolderIds,
    updateDisabledFolderIds,
    moveFiles
  };
}; 