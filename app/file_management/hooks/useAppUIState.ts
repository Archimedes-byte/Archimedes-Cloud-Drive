import { useCallback, useRef } from 'react';
import { useAppState } from '../context/AppStateContext';

/**
 * UI状态管理Hook - 基于全局状态管理
 * 负责管理UI元素的显示状态，如侧边栏、模态框等
 */
export const useAppUIState = () => {
  const { state, dispatch } = useAppState();
  const { 
    sidebarVisible,
    myFilesExpanded,
    quickAccessExpanded,
    isUploadModalOpen,
    isFolderUploadModalOpen,
    showUploadDropdown,
    showSearchView,
    isCreatingFolder,
    showThemePanel
  } = state.ui;
  
  // 上传下拉菜单的引用，用于点击外部关闭
  const uploadDropdownRef = useRef<HTMLDivElement>(null);
  
  /**
   * 设置侧边栏可见性
   */
  const setSidebarVisible = useCallback((visible: boolean) => {
    dispatch({ type: 'SET_SIDEBAR_VISIBLE', payload: visible });
  }, [dispatch]);
  
  /**
   * 设置"我的文件"是否展开
   */
  const setMyFilesExpanded = useCallback((expanded: boolean) => {
    dispatch({ type: 'SET_MY_FILES_EXPANDED', payload: expanded });
  }, [dispatch]);
  
  /**
   * 设置"快速访问"是否展开
   */
  const setQuickAccessExpanded = useCallback((expanded: boolean) => {
    dispatch({ type: 'SET_QUICK_ACCESS_EXPANDED', payload: expanded });
  }, [dispatch]);
  
  /**
   * 设置上传模态框是否打开
   */
  const setIsUploadModalOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_UPLOAD_MODAL_OPEN', payload: open });
    
    // 如果关闭上传模态框，也关闭上传下拉菜单
    if (!open && showUploadDropdown) {
      dispatch({ type: 'SET_SHOW_UPLOAD_DROPDOWN', payload: false });
    }
  }, [dispatch, showUploadDropdown]);
  
  /**
   * 设置文件夹上传模态框是否打开
   */
  const setIsFolderUploadModalOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_FOLDER_UPLOAD_MODAL_OPEN', payload: open });
    
    // 如果关闭文件夹上传模态框，也关闭上传下拉菜单
    if (!open && showUploadDropdown) {
      dispatch({ type: 'SET_SHOW_UPLOAD_DROPDOWN', payload: false });
    }
  }, [dispatch, showUploadDropdown]);
  
  /**
   * 设置上传下拉菜单是否显示
   */
  const setShowUploadDropdown = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_UPLOAD_DROPDOWN', payload: show });
  }, [dispatch]);
  
  /**
   * 设置搜索视图是否显示
   */
  const setShowSearchView = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_SEARCH_VIEW', payload: show });
  }, [dispatch]);
  
  /**
   * 设置是否正在创建文件夹
   */
  const setIsCreatingFolder = useCallback((creating: boolean) => {
    dispatch({ type: 'SET_IS_CREATING_FOLDER', payload: creating });
  }, [dispatch]);
  
  /**
   * 设置主题面板是否显示
   */
  const setShowThemePanel = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_THEME_PANEL', payload: show });
  }, [dispatch]);
  
  /**
   * 切换侧边栏可见性
   */
  const toggleSidebar = useCallback(() => {
    setSidebarVisible(!sidebarVisible);
  }, [sidebarVisible, setSidebarVisible]);
  
  /**
   * 切换"我的文件"展开状态
   */
  const toggleMyFilesExpanded = useCallback(() => {
    setMyFilesExpanded(!myFilesExpanded);
  }, [myFilesExpanded, setMyFilesExpanded]);
  
  /**
   * 切换"快速访问"展开状态
   */
  const toggleQuickAccessExpanded = useCallback(() => {
    setQuickAccessExpanded(!quickAccessExpanded);
  }, [quickAccessExpanded, setQuickAccessExpanded]);
  
  /**
   * 切换上传下拉菜单显示状态
   */
  const toggleUploadDropdown = useCallback(() => {
    setShowUploadDropdown(!showUploadDropdown);
  }, [showUploadDropdown, setShowUploadDropdown]);
  
  /**
   * 切换主题面板显示状态
   */
  const toggleThemePanel = useCallback(() => {
    setShowThemePanel(!showThemePanel);
  }, [showThemePanel, setShowThemePanel]);
  
  return {
    sidebarVisible,
    myFilesExpanded,
    quickAccessExpanded,
    isUploadModalOpen,
    isFolderUploadModalOpen,
    showUploadDropdown,
    showSearchView,
    isCreatingFolder,
    showThemePanel,
    uploadDropdownRef,
    setSidebarVisible,
    setMyFilesExpanded,
    setQuickAccessExpanded,
    setIsUploadModalOpen,
    setIsFolderUploadModalOpen,
    setShowUploadDropdown,
    setShowSearchView,
    setIsCreatingFolder,
    setShowThemePanel,
    toggleSidebar,
    toggleMyFilesExpanded,
    toggleQuickAccessExpanded,
    toggleUploadDropdown,
    toggleThemePanel
  };
}; 