import { useState, useCallback } from 'react';
import { FileInfo } from '@/app/types';
import { message } from 'antd';

/**
 * 文件选择管理Hook
 * 管理文件选择相关状态和操作
 */
export function useFileSelection(initialSelectedFiles: string[] = []) {
  // 选择的文件IDs
  const [selectedFiles, setSelectedFiles] = useState<string[]>(initialSelectedFiles);
  // 禁用的文件夹IDs（移动操作中不能选择的目标文件夹）
  const [disabledFolderIds, setDisabledFolderIds] = useState<string[]>([]);

  /**
   * 选择文件
   * @param fileId 文件ID
   */
  const selectFile = useCallback((fileId: string) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileId)) {
        return prev;
      }
      return [...prev, fileId];
    });
  }, []);

  /**
   * 取消选择文件
   * @param fileId 文件ID
   */
  const deselectFile = useCallback((fileId: string) => {
    setSelectedFiles(prev => prev.filter(id => id !== fileId));
  }, []);

  /**
   * 切换文件选择状态
   * @param fileId 文件ID
   */
  const toggleFileSelection = useCallback((fileId: string) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      }
      return [...prev, fileId];
    });
  }, []);

  /**
   * 处理文件复选框变化
   * @param file 文件信息
   * @param checked 是否选中
   */
  const handleFileCheckboxChange = useCallback((file: FileInfo, checked: boolean) => {
    if (checked) {
      selectFile(file.id);
    } else {
      deselectFile(file.id);
    }
  }, [selectFile, deselectFile]);

  /**
   * 选择全部文件
   * @param files 文件列表
   */
  const selectAllFiles = useCallback((files: FileInfo[]) => {
    const fileIds = files.map(file => file.id);
    setSelectedFiles(fileIds);
  }, []);

  /**
   * 取消选择所有文件
   */
  const deselectAllFiles = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  /**
   * 更新移动操作中禁用的文件夹ID列表
   * @param files 当前文件列表
   */
  const updateDisabledFolderIds = useCallback((files: FileInfo[]) => {
    const disabled = files
      .filter(file => selectedFiles.includes(file.id) && file.isFolder)
      .map(file => file.id);
    
    setDisabledFolderIds(disabled);
    return disabled;
  }, [selectedFiles]);

  /**
   * 检查选择的文件数量是否符合要求
   * @param requiredCount 要求的数量，默认为1
   * @param maxCount 最大允许的数量，默认为无限
   * @param operation 操作名称，用于错误提示
   * @returns 是否符合要求
   */
  const validateSelectionCount = useCallback((requiredCount: number = 1, maxCount?: number, operation: string = '此操作') => {
    if (selectedFiles.length === 0) {
      message.warning(`请至少选择一个文件进行${operation}`);
      return false;
    }
    
    if (requiredCount > 1 && selectedFiles.length < requiredCount) {
      message.warning(`请至少选择${requiredCount}个文件进行${operation}`);
      return false;
    }
    
    if (maxCount !== undefined && selectedFiles.length > maxCount) {
      if (maxCount === 1) {
        message.warning(`${operation}只能选择一个文件`);
      } else {
        message.warning(`${operation}最多只能选择${maxCount}个文件`);
      }
      return false;
    }
    
    return true;
  }, [selectedFiles.length]);

  return {
    // 状态
    selectedFiles,
    disabledFolderIds,
    
    // 设置器
    setSelectedFiles,
    setDisabledFolderIds,
    
    // 操作方法
    selectFile,
    deselectFile,
    toggleFileSelection,
    handleFileCheckboxChange,
    selectAllFiles,
    deselectAllFiles,
    updateDisabledFolderIds,
    validateSelectionCount
  };
} 