// @ts-nocheck
'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
import Head from 'next/head';

// 导入组件
import {
  PageLayout,
  UploadModal,
  FilePreview,
  RenameModal,
  FolderSelectModal,
  CreateFavoriteModal,
  CreateFolderModal,
  ShareModal,
  LinkInputModal,
  FavoriteModal,
} from '@/app/components/features/file-management';

// 导入ContentArea组件
import { ContentArea } from '@/app/components/features/file-management/layout';

// 导入自定义 hooks
import { 
  useFiles, 
  useFileOperations, 
  useFilePreview,
  useLoadingState, 
  useUIState, 
  useThemeManager, 
  useProfile,
  useFileShare,
  useFileSearch,
  useViewState,
  useRecentContent,
  useModalState
} from '@/app/hooks';

// 导入类型
import { FileInfo } from '@/app/types';
import { FileTypeEnum, SortDirectionEnum } from '@/app/types/domains/fileTypes';

// 导入API客户端
import { fileApi } from '@/app/lib/api/file-api';

interface FileManagementPageProps {
  initialShowShares?: boolean;
}

export default function FileManagementPage({ initialShowShares = false }: FileManagementPageProps = {}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // 获取用户资料相关状态，包括加载状态
  const { 
    userProfile, 
    isLoading: profileLoading, 
    error: profileError,
    fetchUserProfile, 
    forceRefreshProfile,
    effectiveAvatarUrl
  } = useProfile();

  // 使用主题管理hook
  const { currentTheme, updateTheme } = useThemeManager();

  // 使用双状态加载管理
  const {
    loadingState,
    error: loadingError,
    isInitialLoading,
    isRefreshing,
    isError: isLoadingError,
    startLoading,
    finishLoading
  } = useLoadingState({
    initialLoad: true,
    minLoadingTime: 800
  });
  
  // 使用useFiles钩子获取文件列表和相关操作
  const {
    files,
    isLoading: filesLoading,
    error: filesError,
    currentFolderId,
    folderPath,
    selectedFileType,
    selectedFiles,
    sortOrder,
    fileUpdateTrigger,
    loadFiles,
    toggleSelectFile: handleSelectFile,
    toggleSelectAll,
    changeSort,
    filterByFileType,
    openFolder,
    refreshCurrentFolder,
    handleFileClick,
    handleBackClick,
    handleFileUpdate,
    setCurrentFolderId,
    setFolderPath,
    setSelectedFileType,
    setSelectedFiles,
    setSortOrder
  } = useFiles();

  // 使用ref跟踪初始化状态，避免重复加载
  const hasInitialized = useRef(false);

  // 确保在组件加载时只加载一次根目录文件
  useEffect(() => {
    // 仅在第一次渲染时加载根目录文件，避免无限循环
    if (!hasInitialized.current && !initialShowShares) {
      console.log('页面初始化：加载根目录文件');
      loadFiles(null, null, true);
      hasInitialized.current = true;
    }
  }, [initialShowShares]); // 移除loadFiles依赖，只依赖initialShowShares

  // 使用UI状态管理
  const {
    sidebarVisible,
    myFilesExpanded,
    quickAccessExpanded,
    showUploadDropdown,
    setSidebarVisible,
    setMyFilesExpanded,
    setQuickAccessExpanded,
    setShowUploadDropdown,
    uploadDropdownRef
  } = useUIState();

  // 使用模态窗口状态管理
  const {
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
  } = useModalState();

  // 使用文件分享管理
  const {
    isShareModalOpen,
    openShareModal,
    closeShareModal,
    shareFiles
  } = useFileShare();

  // 使用视图状态管理
  const {
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
    handleCreateFavoriteFolder,
    handleFavoriteCreateSuccess
  } = useViewState(null, initialShowShares);

  // 使用最近内容管理
  const {
    recentFiles,
    loadingRecentFiles,
    recentDownloads,
    loadingRecentDownloads,
    fetchRecentFiles,
    fetchRecentDownloads
  } = useRecentContent();

  // 添加主题面板状态
  const [showThemePanel, setShowThemePanel] = useState(false);
  
  // 添加收藏文件IDs状态
  const [favoritedFileIds, setFavoritedFileIds] = useState<string[]>([]);
  
  // 文件夹选择相关状态
  const [disabledFolderIds, setDisabledFolderIds] = useState<string[]>([]);
  
  // 添加快捷键监听器
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        openLinkInputModal('', '');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openLinkInputModal]);
  
  // 文件操作钩子
  const {
    createFolder: handleCreateFolder,
    downloadFiles: handleDownload,
    deleteFiles: handleDelete,
    renameFile: handleRenameFile,
    isLoading: fileOperationsLoading,
    error: fileOperationsError
  } = useFileOperations([]);

  // 文件搜索钩子
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isLoading: searchLoading,
    error: searchError,
    searchType,
    setSearchType,
    enableRealTimeSearch,
    setEnableRealTimeSearch,
    debounceDelay,
    setDebounceDelay,
    handleSearch,
    updateFileInResults,
    clearSearchHistory,
    searchHistory
  } = useFileSearch();

  // 文件预览和重命名
  const {
    previewFile,
    setPreviewFile,
    handlePreview: handlePreviewFile,
    closePreview: handleClosePreview,
    isRenameModalOpen,
    setIsRenameModalOpen,
    fileToRename,
    setFileToRename,
    openRename: handleRenameButtonClick,
    renameFile: handleConfirmEdit
  } = useFilePreview();

  // 处理上传成功
  const handleUploadSuccess = useCallback(() => {
    refreshCurrentFolder();
  }, [refreshCurrentFolder]);

  // 处理登出
  const handleSignOut = async () => {
    try {
      await signOut({ redirect: true, callbackUrl: '/' });
      router.push('/');
    } catch (error) {
      console.error('登出失败', error);
    }
  };

  // 处理Breadcrumb路径点击
  const handleBreadcrumbPathClick = useCallback((folderId: string | null) => {
    if (folderId) {
      const folderIndex = folderPath.findIndex(folder => folder.id === folderId);
      if (folderIndex >= 0) {
        // 点击的是路径中的文件夹，构建该层级的路径
        const newFolderPath = folderPath.slice(0, folderIndex + 1);
        setFolderPath(newFolderPath);
        setCurrentFolderId(folderId);
        loadFiles(folderId, selectedFileType);
      }
    } else {
      // 点击的是根文件夹
      setFolderPath([]);
      setCurrentFolderId(null);
      loadFiles(null, selectedFileType);
    }
  }, [folderPath, setFolderPath, setCurrentFolderId, loadFiles, selectedFileType]);

  // 处理Breadcrumb返回点击
  const handleBreadcrumbBackClick = useCallback(() => {
    if (folderPath.length > 0) {
      const newFolderPath = [...folderPath];
      newFolderPath.pop(); // 移除最后一个元素

      const parentId = newFolderPath.length > 0 
        ? newFolderPath[newFolderPath.length - 1].id 
        : null;

      setFolderPath(newFolderPath);
      setCurrentFolderId(parentId);
      loadFiles(parentId, selectedFileType);
    }
  }, [folderPath, setFolderPath, setCurrentFolderId, loadFiles, selectedFileType]);

  // 处理清除过滤器
  const handleClearFilter = useCallback(() => {
    // 清空选中的文件类型
    setSelectedFileType(null);
    // 关闭所有特殊视图并重置当前视图状态
    closeAllSpecialViews();
    // 重新加载文件，不应用过滤器
    loadFiles(currentFolderId, null);
    console.log('已清除过滤器，重置视图状态');
  }, [setSelectedFileType, closeAllSpecialViews, loadFiles, currentFolderId]);

  // 处理文件项点击
  const handleFileItemClick = useCallback((file: FileInfo) => {
    if (file.isFolder) {
      // 如果是文件夹，导航到该文件夹
      handleFileClick(file);
    } else {
      // 如果是文件，预览该文件
      handlePreviewFile(file);
    }
  }, [handleFileClick, handlePreviewFile]);

  // 处理文件右键菜单
  const handleFileContextMenu = useCallback((event: React.MouseEvent, file: FileInfo) => {
    event.preventDefault();
    // TODO: 实现文件右键菜单
    console.log('File context menu', file);
  }, []);

  // 处理文件选择变化
  const onFileCheckboxChange = useCallback((file: FileInfo, checked: boolean) => {
    handleSelectFile(file.id, checked);
  }, [handleSelectFile]);

  // 全选文件
  const onSelectAllFiles = useCallback(() => {
    toggleSelectAll(true);
  }, [toggleSelectAll]);

  // 取消全选
  const onDeselectAllFiles = useCallback(() => {
    setSelectedFiles([]);
  }, [setSelectedFiles]);

  // 处理刷新文件列表
  const handleRefreshFiles = useCallback(() => {
    refreshCurrentFolder();
  }, [refreshCurrentFolder]);

  // 处理创建文件夹点击
  const handleCreateFolderClick = useCallback(() => {
    openCreateFolderModal();
  }, [openCreateFolderModal]);

  // 添加一个useEffect来初始加载收藏文件IDs
  useEffect(() => {
    // 加载收藏文件ID列表
    const loadFavoritedFileIds = async () => {
      try {
        console.log('加载收藏文件ID列表...');
        // 使用fileApi获取所有收藏
        const favorites = await fileApi.getFavorites();
        if (favorites && favorites.items) {
          // 从收藏列表中提取文件ID
          const favoriteIds = favorites.items.map(item => item.id);
          console.log(`加载了${favoriteIds.length}个收藏文件ID`);
          setFavoritedFileIds(favoriteIds);
        }
      } catch (error) {
        console.error('加载收藏文件ID列表失败:', error);
      }
    };

    // 初始化加载收藏列表
    if (status === 'authenticated') {
      loadFavoritedFileIds();
    }
  }, [status]);

  // 监听取消收藏事件
  useEffect(() => {
    // 收藏页面取消收藏后更新星标状态的处理函数
    const handleUnfavoriteEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{fileIds: string[]}>;
      const unfavoritedIds = customEvent.detail.fileIds;
      
      console.log('收到取消收藏事件，更新星标状态:', unfavoritedIds);
      
      // 更新收藏文件ID列表，移除已取消收藏的文件ID
      setFavoritedFileIds(prevIds => 
        prevIds.filter(id => !unfavoritedIds.includes(id))
      );
      
      // 可选：刷新当前文件夹以确保UI状态同步
      refreshCurrentFolder();
    };
    
    // 添加事件监听器
    window.addEventListener('unfavorite_files', handleUnfavoriteEvent);
    
    // 组件卸载时移除事件监听器
    return () => {
      window.removeEventListener('unfavorite_files', handleUnfavoriteEvent);
    };
  }, [refreshCurrentFolder]);

  // 处理切换收藏
  const handleToggleFavorite = useCallback((file: FileInfo, isFavorite: boolean) => {
    // 实现切换收藏功能
    console.log('切换收藏状态', file, isFavorite);
    
    // 立即更新UI状态，确保星标即时显示变化
    setFavoritedFileIds(prevIds => {
      if (isFavorite) {
        // 添加到收藏
        if (!prevIds.includes(file.id)) {
          return [...prevIds, file.id];
        }
      } else {
        // 从收藏中移除
        return prevIds.filter(id => id !== file.id);
      }
      return prevIds;
    });
    
    // 调用API保存收藏状态
    fileApi.toggleFavorite(file.id, isFavorite)
      .then(result => {
        console.log('收藏状态已保存', result);
        // 刷新文件列表，确保状态同步
        refreshCurrentFolder();
      })
      .catch(error => {
        console.error('收藏操作失败', error);
        message.error('收藏状态更新失败，请重试');
        
        // 恢复原始状态
        setFavoritedFileIds(prevIds => {
          if (isFavorite) {
            // 如果添加收藏失败，从列表中移除
            return prevIds.filter(id => id !== file.id);
          } else {
            // 如果移除收藏失败，添加回列表
            if (!prevIds.includes(file.id)) {
              return [...prevIds, file.id];
            }
          }
          return prevIds;
        });
      });
  }, [refreshCurrentFolder]);

  // 处理移动按钮点击
  const handleMoveButtonClick = useCallback(() => {
    if (selectedFiles.length === 0) {
      message.warning('请选择要移动的文件');
      return;
    }

    // 准备禁用的文件夹ID列表：当前所选文件(如果是文件夹)不能成为目标文件夹
    const disabled = files
      .filter(file => selectedFiles.includes(file.id) && file.isFolder)
      .map(file => file.id);

    setDisabledFolderIds(disabled);
    openMoveModal();
  }, [files, selectedFiles, openMoveModal]);

  // 处理移动文件
  const handleMove = useCallback(async (targetFolderId: string) => {
    if (selectedFiles.length === 0) {
      message.warning('请选择要移动的文件');
      return;
    }

    setIsMoveLoading(true);

    try {
      // 使用fileApi客户端来实际执行文件移动
      await fileApi.moveFiles(selectedFiles, targetFolderId);
      
      // 成功后关闭模态窗口并刷新文件列表
      closeMoveModal();
      
      // 确保刷新文件列表，显示最新的文件状态
      await refreshCurrentFolder();
      
      // 清除选择
      setSelectedFiles([]);
      message.success('文件移动成功');
    } catch (error) {
      console.error('移动文件失败:', error);
      message.error(error instanceof Error ? error.message : '移动文件失败，请重试');
    } finally {
      setIsMoveLoading(false);
    }
  }, [selectedFiles, refreshCurrentFolder, setSelectedFiles, closeMoveModal, setIsMoveLoading, fileApi]);

  // 处理分享按钮点击
  const handleShareButtonClick = useCallback(() => {
    if (selectedFiles.length === 0) {
      message.warning('请选择要分享的文件');
      return;
    }
    openShareModal(selectedFiles);
  }, [selectedFiles, openShareModal]);

  // 处理链接输入提交
  const handleLinkSubmit = useCallback(async () => {
    try {
      if (!shareLink) {
        message.warning('请输入分享链接');
        return;
      }

      // 显示加载中提示
      const loadingMessage = message.loading('正在验证分享链接...', 0);

      // 调用API验证分享链接
      const response = await fetch('/api/storage/share/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shareLink,
          extractCode: shareLinkPassword,
        }),
      });

      // 关闭加载提示
      loadingMessage();

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '验证分享链接失败');
      }

      // 如果需要提取码但未提供或提取码错误
      if (data.needsExtractCode) {
        message.warning(data.error || '请提供正确的提取码');
        return; // 保持弹窗打开，让用户输入提取码
      }
      
      if (data.success) {
        // 关闭链接输入弹窗
        closeLinkInputModal();
        
        // 根据分享信息显示文件
        const shareInfo = data.shareInfo;
        message.success('分享链接验证成功，正在打开分享内容...');
        
        // 这里可以根据分享的内容跳转到相应的页面或显示相应的内容
        // 例如，如果是单个文件，可以直接预览
        if (shareInfo.files.length === 1 && !shareInfo.files[0].isFolder) {
          // 修改为使用分享页面而不是直接预览
          router.push(`/s/${shareInfo.shareCode}`);
        } else {
          // 如果是多个文件或文件夹，可以导航到特定的共享视图
          // 这里需要根据实际应用逻辑进行实现
          router.push(`/s/${shareInfo.shareCode}`);
        }
      } else {
        message.error(data.error || '分享链接无效');
      }
    } catch (error) {
      console.error('处理分享链接时出错:', error);
      message.error((error as Error).message || '处理分享链接失败，请重试');
    }
  }, [shareLink, shareLinkPassword, closeLinkInputModal, handlePreviewFile, router]);

  // 处理分享成功
  const handleShareSuccess = useCallback((result: { shareLink: string, extractCode: string }) => {
    openLinkInputModal(result.shareLink, result.extractCode);
  }, [openLinkInputModal]);

  // 添加收藏夹选择框的监听器
  const [favoriteModalVisible, setFavoriteModalVisible] = useState(false);
  const [selectedFileForFavorite, setSelectedFileForFavorite] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    const handleOpenFavoriteModal = (event: Event) => {
      const customEvent = event as CustomEvent<{fileId: string, fileName: string}>;
      setSelectedFileForFavorite({
        id: customEvent.detail.fileId,
        name: customEvent.detail.fileName
      });
      setFavoriteModalVisible(true);
    };

    window.addEventListener('open_favorite_modal', handleOpenFavoriteModal);
    return () => {
      window.removeEventListener('open_favorite_modal', handleOpenFavoriteModal);
    };
  }, []);

  // 处理收藏成功
  const handleFavoriteSuccess = () => {
    if (selectedFileForFavorite) {
      setFavoritedFileIds(prev => [...prev, selectedFileForFavorite.id]);
    }
    setFavoriteModalVisible(false);
    setSelectedFileForFavorite(null);
  };

  return (
    <>
      <Head>
        <title>文件管理 - Cloud Drive</title>
      </Head>
      
      <PageLayout 
        selectedFileType={selectedFileType}
        currentView={currentView as any}
        showThemePanel={showThemePanel}
        previewFile={previewFile}
        currentTheme={currentTheme}
        searchType={searchType}
        favoriteFoldersRefreshTrigger={favoriteFoldersRefreshTrigger}
        onTypeClick={(type: FileTypeEnum) => {
          // 先关闭所有特殊视图
          closeAllSpecialViews();
          // 设置当前视图
          setCurrentView(type);
          // 应用文件类型过滤
          filterByFileType(type);
          // 记录当前选择的类型，确保与侧边栏同步
          console.log('文件类型切换为:', type);
        }}
        onSearchClick={(query, type) => {
          // 处理搜索点击，支持文件名搜索和标签搜索
          console.log(`处理搜索点击，查询: ${query}, 类型: ${type}`);
          
          // 调用视图状态钩子处理搜索视图
          handleSearchClick(query, type as 'name' | 'tag');
          
          // 设置搜索类型
          if (type === 'tag') {
            setSearchType('tag');
          } else {
            setSearchType('name');
          }
          
          // 如果有查询字符串，立即进行搜索
          if (query) {
            setSearchQuery(query);
            handleSearch(query, type as 'name' | 'tag');
          }
        }}
        onSharesClick={handleViewMyShares}
        onFavoritesClick={handleFavoritesClick}
        onCreateFavoriteFolder={handleCreateFavoriteFolder}
        onRecentClick={handleRecentClick}
        onRecentDownloadsClick={handleRecentDownloadsClick}
        onThemeClick={() => {
          setShowThemePanel(!showThemePanel);
          if (!showThemePanel) {
            setShowSearchView(false);
            if (previewFile) {
              handleClosePreview();
            }
          }
        }}
        onClosePreview={handleClosePreview}
        onThemeChange={updateTheme}
        onCloseThemePanel={() => setShowThemePanel(false)}
        avatarUrl={effectiveAvatarUrl}
        userName={userProfile?.name || null}
        userEmail={userProfile?.email || null}
        onHomeClick={() => {
          // 先关闭主题面板，再跳转
          setShowThemePanel(false);
          router.push('/file-management/main');
        }}
        onLogoutClick={handleSignOut}
        onAvatarClick={() => router.push('/dashboard')}
      >
        <ContentArea 
          // 视图状态
          showFavoritesContent={showFavoritesContent}
          showRecentFilesContent={showRecentFilesContent}
          showRecentDownloadsContent={showRecentDownloadsContent}
          showMySharesContent={showMySharesContent}
          showSearchView={showSearchView}
          
          // 文件数据
          files={files}
          selectedFiles={selectedFiles}
          isRefreshing={isRefreshing}
          filesLoading={filesLoading}
          filesError={filesError ? filesError.toString() : null}
          favoritedFileIds={favoritedFileIds}
          fileUpdateTrigger={fileUpdateTrigger}
          
          // 面包屑相关
          folderPath={folderPath}
          currentFolderId={currentFolderId}
          selectedFileType={selectedFileType}
          
          // 搜索相关
          searchQuery={searchQuery}
          searchType={searchType}
          searchResults={searchResults}
          searchLoading={searchLoading}
          enableRealTimeSearch={enableRealTimeSearch}
          
          // 最近文件和下载
          recentFiles={recentFiles}
          loadingRecentFiles={loadingRecentFiles}
          recentDownloads={recentDownloads}
          loadingRecentDownloads={loadingRecentDownloads}
          
          // 排序相关
          sortOrder={sortOrder}
          
          // 收藏夹
          selectedFavoriteFolderId={selectedFavoriteFolderId}
          
          // 模态窗口状态
          showUploadDropdown={showUploadDropdown}
          uploadDropdownRef={uploadDropdownRef}
          
          // 事件处理函数
          onBreadcrumbPathClick={handleBreadcrumbPathClick}
          onBreadcrumbBackClick={handleBreadcrumbBackClick}
          onClearFilter={handleClearFilter}
          closeAllSpecialViews={closeAllSpecialViews}
          onFileClick={handleFileClick}
          onPreviewFile={handlePreviewFile}
          onFileItemClick={handleFileItemClick}
          onFileCheckboxChange={onFileCheckboxChange}
          onSelectAllFiles={onSelectAllFiles}
          onDeselectAllFiles={onDeselectAllFiles}
          onToggleFavorite={handleToggleFavorite}
          onFileContextMenu={handleFileContextMenu}
          onDownload={handleDownload}
          onShare={handleShareButtonClick}
          onDelete={handleDelete}
          onRefreshFiles={handleRefreshFiles}
          onCreateFolder={handleCreateFolderClick}
          onRename={handleRenameButtonClick}
          onMove={handleMoveButtonClick}
          onSearch={handleSearch}
          onSearchChange={setSearchQuery}
          onRealTimeSearchChange={setEnableRealTimeSearch}
          
          // 模态窗口操作
          setShowUploadDropdown={setShowUploadDropdown}
          setIsUploadModalOpen={setIsUploadModalOpen}
          setIsFolderUploadModalOpen={setIsFolderUploadModalOpen}
          changeSort={changeSort}
          setSortOrder={setSortOrder}
        />
      </PageLayout>
      
      {/* 上传模态窗口 */}
      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={closeUploadModal} 
        onSuccess={handleUploadSuccess}
        currentFolderId={currentFolderId}
        isFolderUpload={false}
      />
      
      <UploadModal 
        isOpen={isFolderUploadModalOpen} 
        onClose={closeFolderUploadModal} 
        onSuccess={handleUploadSuccess}
        currentFolderId={currentFolderId}
        isFolderUpload={true}
      />

      {/* 重命名模态窗口 */}
      <RenameModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        onRename={(newName, tags) => {
          if (!fileToRename) {
            message.warning('未选择要重命名的文件');
            return;
          }
          
          handleConfirmEdit(newName, tags)
            .then(success => {
              if (success) {
                console.log('重命名成功，刷新文件列表');
                // 清空选择状态，避免后续操作引起混乱
                setSelectedFiles([]);
                // 添加手动刷新调用，确保文件列表得到更新
                refreshCurrentFolder();
              } else {
                console.error('重命名失败');
              }
            })
            .catch(err => {
              console.error('重命名过程出错:', err);
            });
        }}
        initialName={fileToRename?.name || ''}
        initialTags={fileToRename?.tags || []}
        fileType={fileToRename?.isFolder ? 'folder' : 'file'}
      />

      {/* 文件预览组件应该位于整个应用的最外层，确保它覆盖其他所有内容 */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          onClose={handleClosePreview}
          onDownload={(file) => {
            if (file && file.id) {
              handleDownload([file.id]);
            } else {
              message.warning('无法下载此文件，文件ID不存在');
            }
          }}
        />
      )}

      {/* 添加文件夹选择弹窗 */}
      <FolderSelectModal 
        isOpen={isMoveModalOpen}
        onClose={closeMoveModal}
        onConfirm={handleMove}
        currentFolderId={currentFolderId}
        disabledFolderIds={disabledFolderIds}
        isLoading={isMoveLoading}
        onRefresh={handleRefreshFiles}
      />

      {/* 分享模态窗口 */}
      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={closeShareModal}
        selectedFiles={files.filter(file => selectedFiles.includes(file.id))}
        onShare={shareFiles}
        onShareSuccess={handleShareSuccess}
      />
      
      {/* 链接输入模态窗口 */}
      <LinkInputModal
        isVisible={isLinkInputVisible}
        shareLink={shareLink}
        shareLinkPassword={shareLinkPassword}
        onShareLinkChange={setShareLink}
        onShareLinkPasswordChange={setShareLinkPassword}
        onSubmit={handleLinkSubmit}
        onCancel={closeLinkInputModal}
      />

      {/* 创建收藏夹模态窗口 */}
      <CreateFavoriteModal 
        visible={isCreateFavoriteModalOpen}
        onClose={() => setIsCreateFavoriteModalOpen(false)}
        onSuccess={handleFavoriteCreateSuccess}
      />

      {/* 创建文件夹模态窗口 */}
      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={closeCreateFolderModal}
        onCreateFolder={async (name, tags) => {
          startLoading(true);
          
          try {
            const folderId = await handleCreateFolder(
              name,
              currentFolderId,
              tags
            );
            
            if (folderId) {
              await loadFiles(currentFolderId, selectedFileType, true);
              message.success('文件夹创建成功');
            } else {
              message.error('创建文件夹失败，请检查文件夹名称或重试');
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '创建文件夹时发生错误';
            
            if (errorMessage.includes('已存在') || errorMessage.includes('同名')) {
              message.warning('文件夹名称已存在，请使用其他名称');
            } else {
              message.error(errorMessage);
            }
            throw error;
          } finally {
            finishLoading();
          }
        }}
      />

      {/* 收藏夹选择框 */}
      <FavoriteModal
        fileId={selectedFileForFavorite?.id || ''}
        fileName={selectedFileForFavorite?.name || ''}
        visible={favoriteModalVisible}
        onClose={() => {
          setFavoriteModalVisible(false);
          setSelectedFileForFavorite(null);
        }}
        onSuccess={handleFavoriteSuccess}
      />
    </>
  );
}
       