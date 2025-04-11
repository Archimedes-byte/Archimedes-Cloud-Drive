import { useCallback } from 'react';
import { useAppState } from '../context/AppStateContext';
import { FileInfo } from '@/app/types';
import { api } from '@/app/lib/api/client';
import { message } from 'antd';

/**
 * 文件预览和重命名Hook - 基于全局状态管理
 * 负责处理文件预览和重命名相关操作
 */
export const useAppFilePreview = (onOperationComplete?: () => void) => {
  const { state, dispatch } = useAppState();
  const { previewFile, fileToRename, isRenameModalOpen } = state.preview;
  
  /**
   * 设置预览文件
   */
  const setPreviewFile = useCallback((file: FileInfo | null) => {
    dispatch({ type: 'SET_PREVIEW_FILE', payload: file });
  }, [dispatch]);
  
  /**
   * 设置要重命名的文件
   */
  const setFileToRename = useCallback((file: FileInfo | null) => {
    dispatch({ type: 'SET_FILE_TO_RENAME', payload: file });
  }, [dispatch]);
  
  /**
   * 设置重命名模态框是否打开
   */
  const setIsRenameModalOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_IS_RENAME_MODAL_OPEN', payload: open });
  }, [dispatch]);
  
  /**
   * 打开文件预览
   */
  const handlePreviewFile = useCallback((file: FileInfo) => {
    if (file.isFolder) return; // 文件夹不能预览
    setPreviewFile(file);
  }, [setPreviewFile]);
  
  /**
   * 关闭文件预览
   */
  const handleClosePreview = useCallback(() => {
    setPreviewFile(null);
  }, [setPreviewFile]);
  
  /**
   * 重命名按钮点击处理
   */
  const handleRenameButtonClick = useCallback((file: FileInfo) => {
    setFileToRename(file);
    setIsRenameModalOpen(true);
  }, [setFileToRename, setIsRenameModalOpen]);
  
  /**
   * 执行文件重命名
   */
  const handleRenameFile = useCallback(async (newName: string) => {
    if (!fileToRename) return;
    
    try {
      // 保持文件扩展名
      let finalName = newName;
      const originalExt = fileToRename.name.split('.').pop();
      const newExt = newName.split('.').pop();
      
      // 如果原文件有扩展名但新名称没有，则添加扩展名
      if (originalExt && originalExt !== newExt && !fileToRename.isFolder) {
        finalName = `${newName}.${originalExt}`;
      }
      
      await api.patch(`/api/files/${fileToRename.id}/rename`, {
        name: finalName
      });
      
      // 关闭重命名模态框
      setIsRenameModalOpen(false);
      setFileToRename(null);
      
      // 显示成功消息
      message.success('文件重命名成功');
      
      // 刷新文件列表
      if (onOperationComplete) {
        onOperationComplete();
      }
    } catch (error) {
      console.error('重命名文件失败:', error);
      message.error(error instanceof Error ? error.message : '重命名文件失败，请稍后重试');
    }
  }, [fileToRename, onOperationComplete, setFileToRename, setIsRenameModalOpen]);
  
  /**
   * 处理文件右键菜单
   */
  const handleFileContextMenu = useCallback((e: React.MouseEvent, file: FileInfo) => {
    e.preventDefault();
    // 这里可以实现自定义右键菜单
    console.log('文件右键菜单:', file);
  }, []);
  
  return {
    previewFile,
    fileToRename,
    isRenameModalOpen,
    setPreviewFile,
    setFileToRename,
    setIsRenameModalOpen,
    handlePreviewFile,
    handleClosePreview,
    handleRenameButtonClick,
    handleRenameFile,
    handleFileContextMenu
  };
}; 