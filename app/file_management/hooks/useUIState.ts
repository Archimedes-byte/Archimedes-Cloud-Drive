import { useState, useCallback, useRef, useEffect } from 'react';

export interface UIState {
  // 侧边栏状态
  sidebarVisible: boolean;
  myFilesExpanded: boolean;
  quickAccessExpanded: boolean;
  
  // 上传相关状态
  isUploadModalOpen: boolean;
  isFolderUploadModalOpen: boolean;
  showUploadDropdown: boolean;
  isUploadDropdownOpen: boolean;
  
  // 引用
  uploadDropdownRef: React.RefObject<HTMLDivElement>;
}

export const useUIState = () => {
  // 侧边栏状态
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [myFilesExpanded, setMyFilesExpanded] = useState(true);
  const [quickAccessExpanded, setQuickAccessExpanded] = useState(true);
  
  // 上传相关状态
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFolderUploadModalOpen, setIsFolderUploadModalOpen] = useState(false);
  const [showUploadDropdown, setShowUploadDropdown] = useState(false);
  const [isUploadDropdownOpen, setIsUploadDropdownOpen] = useState(false);
  
  // refs
  const uploadDropdownRef = useRef<HTMLDivElement>(null);
  
  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (uploadDropdownRef.current && !uploadDropdownRef.current.contains(event.target as Node)) {
        // 关闭上传下拉菜单
        setShowUploadDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // 清理函数 - 关闭所有模态窗口和下拉菜单
  const closeAllModalsAndDropdowns = useCallback(() => {
    setIsUploadModalOpen(false);
    setIsFolderUploadModalOpen(false);
    setShowUploadDropdown(false);
    setIsUploadDropdownOpen(false);
  }, []);
  
  // 切换侧边栏可见性
  const toggleSidebar = useCallback(() => {
    setSidebarVisible(prev => !prev);
  }, []);
  
  // 切换文件和快速访问区域的展开状态
  const toggleMyFiles = useCallback(() => {
    setMyFilesExpanded(prev => !prev);
  }, []);
  
  const toggleQuickAccess = useCallback(() => {
    setQuickAccessExpanded(prev => !prev);
  }, []);

  return {
    // 状态
    sidebarVisible,
    myFilesExpanded,
    quickAccessExpanded,
    isUploadModalOpen,
    isFolderUploadModalOpen,
    showUploadDropdown,
    isUploadDropdownOpen,
    
    // 设置函数
    setSidebarVisible,
    setMyFilesExpanded,
    setQuickAccessExpanded,
    setIsUploadModalOpen,
    setIsFolderUploadModalOpen,
    setShowUploadDropdown,
    setIsUploadDropdownOpen,
    
    // 辅助函数
    toggleSidebar,
    toggleMyFiles,
    toggleQuickAccess,
    closeAllModalsAndDropdowns,
    
    // refs
    uploadDropdownRef
  };
}; 