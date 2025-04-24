import { useState, useCallback } from 'react';

/**
 * 自定义Hook，用于管理应用中各种模态窗口的状态
 * 统一管理模态窗口的打开、关闭以及相关状态
 */
export const useModalState = () => {
  // 文件夹操作相关模态窗口
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isMoveLoading, setIsMoveLoading] = useState(false);
  
  // 分享链接相关状态
  const [isLinkInputVisible, setIsLinkInputVisible] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareLinkPassword, setShareLinkPassword] = useState('');
  
  // 上传相关模态窗口
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFolderUploadModalOpen, setIsFolderUploadModalOpen] = useState(false);
  
  // 创建文件夹模态窗口操作
  const openCreateFolderModal = useCallback(() => {
    setIsCreateFolderModalOpen(true);
  }, []);
  
  const closeCreateFolderModal = useCallback(() => {
    setIsCreateFolderModalOpen(false);
  }, []);
  
  // 移动文件夹模态窗口操作
  const openMoveModal = useCallback(() => {
    setIsMoveModalOpen(true);
  }, []);
  
  const closeMoveModal = useCallback(() => {
    setIsMoveModalOpen(false);
  }, []);
  
  // 链接输入模态窗口操作
  const openLinkInputModal = useCallback((link: string, password: string) => {
    setShareLink(link);
    setShareLinkPassword(password);
    setIsLinkInputVisible(true);
  }, []);
  
  const closeLinkInputModal = useCallback(() => {
    setIsLinkInputVisible(false);
    setShareLink('');
    setShareLinkPassword('');
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
    isCreateFolderModalOpen,
    isMoveModalOpen,
    isMoveLoading,
    isLinkInputVisible,
    shareLink,
    shareLinkPassword,
    isUploadModalOpen,
    isFolderUploadModalOpen,
    
    // 状态设置器
    setIsCreateFolderModalOpen,
    setIsMoveModalOpen,
    setIsMoveLoading,
    setIsLinkInputVisible,
    setShareLink,
    setShareLinkPassword,
    setIsUploadModalOpen,
    setIsFolderUploadModalOpen,
    
    // 模态窗口操作方法
    openCreateFolderModal,
    closeCreateFolderModal,
    openMoveModal,
    closeMoveModal,
    openLinkInputModal,
    closeLinkInputModal,
    openUploadModal,
    closeUploadModal,
    openFolderUploadModal,
    closeFolderUploadModal
  };
}; 