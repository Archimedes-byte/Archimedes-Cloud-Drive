import { useState, useCallback } from 'react';

/**
 * 自定义Hook，用于管理应用中各种模态窗口的状态
 * 统一管理模态窗口的打开、关闭以及相关状态
 */
export const useModalState = () => {
  // 文件夹操作相关模态窗口
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isMoveLoading, setIsMoveLoading] = useState(false);
  
  // 上传相关模态窗口
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFolderUploadModalOpen, setIsFolderUploadModalOpen] = useState(false);
  
  // 移动文件夹模态窗口操作
  const openMoveModal = useCallback(() => {
    setIsMoveModalOpen(true);
  }, []);
  
  const closeMoveModal = useCallback(() => {
    setIsMoveModalOpen(false);
  }, []);
  
  // 上传模态窗口操作
  const openUploadModal = useCallback(() => {
    setIsUploadModalOpen(true);
  }, []);
  
  const closeUploadModal = useCallback(() => {
    setIsUploadModalOpen(false);
  }, []);
  
  // 文件夹上传模态窗口操作
  const openFolderUploadModal = useCallback(() => {
    setIsFolderUploadModalOpen(true);
  }, []);
  
  const closeFolderUploadModal = useCallback(() => {
    setIsFolderUploadModalOpen(false);
  }, []);
  
  return {
    // 状态
    isMoveModalOpen,
    isMoveLoading,
    isUploadModalOpen,
    isFolderUploadModalOpen,
    
    // 状态设置器
    setIsMoveModalOpen,
    setIsMoveLoading,
    setIsUploadModalOpen,
    setIsFolderUploadModalOpen,
    
    // 模态窗口操作方法
    openMoveModal,
    closeMoveModal,
    openUploadModal,
    closeUploadModal,
    openFolderUploadModal,
    closeFolderUploadModal
  };
}; 