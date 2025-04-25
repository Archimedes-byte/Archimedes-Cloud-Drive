import { useState, useCallback } from 'react';
import { FileTypeEnum } from '@/app/types';

// ViewType类型定义
export type ViewType = FileTypeEnum | 'search' | 'favorites' | 'recent' | 'downloads' | 'tag' | 'shares';

/**
 * 管理文件管理视图状态的hook
 */
export function useViewState(initialView: ViewType | null = null, initialShowShares = false) {
  // 当前活动视图
  const [currentView, setCurrentView] = useState<ViewType | null>(initialView);
  
  // 特殊视图状态
  const [showMySharesContent, setShowMySharesContent] = useState(initialShowShares);
  const [showFavoritesContent, setShowFavoritesContent] = useState(false);
  const [showRecentFilesContent, setShowRecentFilesContent] = useState(false);
  const [showRecentDownloadsContent, setShowRecentDownloadsContent] = useState(false);
  const [showSearchView, setShowSearchView] = useState(false);
  
  // 收藏夹相关状态
  const [selectedFavoriteFolderId, setSelectedFavoriteFolderId] = useState<string | undefined>();
  const [isCreateFavoriteModalOpen, setIsCreateFavoriteModalOpen] = useState(false);
  const [favoriteFoldersRefreshTrigger, setFavoriteFoldersRefreshTrigger] = useState(0);
  
  /**
   * 关闭所有特殊视图
   */
  const closeAllSpecialViews = useCallback(() => {
    setShowMySharesContent(false);
    setShowFavoritesContent(false);
    setShowRecentFilesContent(false);
    setShowRecentDownloadsContent(false);
    setShowSearchView(false);
    setCurrentView(null);
  }, []);
  
  /**
   * 处理查看我的分享
   * @param resetPathCallback 可选的重置路径回调函数
   */
  const handleViewMyShares = useCallback((resetPathCallback?: () => void) => {
    // 先关闭所有特殊视图
    closeAllSpecialViews();
    // 重置路径（如果提供了回调）
    if (resetPathCallback) resetPathCallback();
    // 打开我的分享视图
    setShowMySharesContent(true);
    // 设置当前视图类型
    setCurrentView('shares');
  }, [closeAllSpecialViews]);
  
  /**
   * 处理查看收藏夹
   * @param folderId 收藏夹ID
   * @param resetPathCallback 可选的重置路径回调函数
   */
  const handleFavoritesClick = useCallback((folderId?: string, resetPathCallback?: () => void) => {
    // 先关闭所有特殊视图
    closeAllSpecialViews();
    // 重置路径（如果提供了回调）
    if (resetPathCallback) resetPathCallback();
    // 设置选中的收藏夹ID
    setSelectedFavoriteFolderId(folderId);
    // 打开收藏夹视图
    setShowFavoritesContent(true);
    // 设置当前视图类型
    setCurrentView('favorites');
  }, [closeAllSpecialViews]);
  
  /**
   * 处理查看最近文件
   * @param resetPathCallback 可选的重置路径回调函数
   */
  const handleRecentClick = useCallback((resetPathCallback?: () => void) => {
    // 先关闭所有特殊视图
    closeAllSpecialViews();
    // 重置路径（如果提供了回调）
    if (resetPathCallback) resetPathCallback();
    // 打开最近文件视图
    setShowRecentFilesContent(true);
    // 设置当前视图类型
    setCurrentView('recent');
  }, [closeAllSpecialViews]);
  
  /**
   * 处理查看最近下载
   * @param resetPathCallback 可选的重置路径回调函数
   */
  const handleRecentDownloadsClick = useCallback((resetPathCallback?: () => void) => {
    // 先关闭所有特殊视图
    closeAllSpecialViews();
    // 重置路径（如果提供了回调）
    if (resetPathCallback) resetPathCallback();
    // 打开最近下载视图
    setShowRecentDownloadsContent(true);
    // 设置当前视图类型
    setCurrentView('downloads');
  }, [closeAllSpecialViews]);
  
  /**
   * 处理搜索点击
   * @param query 可选的搜索查询
   * @param type 可选的搜索类型，默认为'name'（文件名搜索）
   * @param resetPathCallback 可选的重置路径回调函数
   */
  const handleSearchClick = useCallback((query?: string, type?: 'name' | 'tag', resetPathCallback?: () => void) => {
    // 关闭所有特殊视图
    closeAllSpecialViews();
    // 重置路径（如果提供了回调）
    if (resetPathCallback) resetPathCallback();
    // 打开搜索视图
    setShowSearchView(true);
    
    // 根据搜索类型设置当前视图
    if (type === 'tag') {
      setCurrentView('tag');
    } else {
      setCurrentView('search');
    }
    
    // 这里可以返回查询字符串和类型，由父组件进一步处理
    return { query, type };
  }, [closeAllSpecialViews]);
  
  /**
   * 处理标签搜索点击
   * 这是一个便捷方法，内部调用handleSearchClick并指定类型为tag
   * @param query 可选的搜索查询
   * @param resetPathCallback 可选的重置路径回调函数
   */
  const handleTagSearchClick = useCallback((query?: string, resetPathCallback?: () => void) => {
    return handleSearchClick(query, 'tag', resetPathCallback);
  }, [handleSearchClick]);
  
  /**
   * 处理创建收藏夹
   */
  const handleCreateFavoriteFolder = useCallback(() => {
    setIsCreateFavoriteModalOpen(true);
  }, []);
  
  /**
   * 处理收藏夹创建成功
   */
  const handleFavoriteCreateSuccess = useCallback(() => {
    // 递增刷新触发器，强制侧边栏刷新收藏夹列表
    setFavoriteFoldersRefreshTrigger(prev => prev + 1);
    
    // 添加延迟避免事件循环
    setTimeout(() => {
      // 同时发出全局刷新事件
      const refreshEvent = new CustomEvent('refresh_favorite_folders');
      window.dispatchEvent(refreshEvent);
    }, 100);
  }, []);
  
  return {
    // 状态
    currentView,
    showMySharesContent,
    showFavoritesContent,
    showRecentFilesContent,
    showRecentDownloadsContent,
    showSearchView,
    selectedFavoriteFolderId,
    isCreateFavoriteModalOpen,
    favoriteFoldersRefreshTrigger,
    
    // 状态设置器
    setCurrentView,
    setShowMySharesContent,
    setShowFavoritesContent,
    setShowRecentFilesContent,
    setShowRecentDownloadsContent,
    setShowSearchView,
    setSelectedFavoriteFolderId,
    setIsCreateFavoriteModalOpen,
    setFavoriteFoldersRefreshTrigger,
    
    // 操作方法
    closeAllSpecialViews,
    handleViewMyShares,
    handleFavoritesClick,
    handleRecentClick,
    handleRecentDownloadsClick,
    handleSearchClick,
    handleTagSearchClick,
    handleCreateFavoriteFolder,
    handleFavoriteCreateSuccess
  };
} 