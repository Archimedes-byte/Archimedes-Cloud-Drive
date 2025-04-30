'use client';

/**
 * 文件管理页面
 * 
 * 状态管理优化：
 * 1. 已提取的状态管理Hooks
 *   - useViewState: 视图状态管理（我的文件、收藏夹、最近文件等视图切换）
 *   - useModalState: 模态窗口状态统一管理（已优化移除创建文件夹和分享链接相关状态）
 *   - useUIState: UI状态管理（侧边栏、上传下拉菜单等）
 *   - useShareManagement: 文件分享和分享链接管理（整合了原useFileShare和useShareLink）
 *   - useRecentContent: 最近文件内容管理
 *   - useThemeUI: 主题UI状态管理 (新增)
 *   - useFavorites: 收藏状态管理 (新增)
 *   - useFileSelection: 文件选择状态管理 (新增)
 *   - useFolderCreation: 文件夹创建状态管理 (新增)
 * 
 * 2. 进一步优化点
 *   - 文件移动相关逻辑: 可考虑整合到useFileOperations中，创建专门的useFileMoveOperations钩子
 *   - 文件重命名逻辑: 可以提取handleRenameButtonClick到useFilePreview或创建专门的useFileRename钩子
 *   - 文件预览增强: 扩展useFilePreview，包含更多的预览控制功能
 *   - 上传状态管理: 创建专门的useFileUpload钩子，管理上传模态窗口和上传状态
 *   - 页面初始化逻辑: 提取复杂的页面初始化逻辑到专门的hook
 *   - 事件监听管理: 创建通用的事件监听hook，管理所有的事件订阅和清理
 */

import React, { useCallback, useRef, useEffect } from 'react';
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
  useProfile,
  useFileSearch,
  useViewState,
  useRecentContent,
  useModalState,
  useThemeUI,
  useFavorites,
  useFileSelection,
  useFolderCreation,
  useShareManagement
} from '@/app/hooks';

// 导入类型
import { FileInfo } from '@/app/types';
import { FileTypeEnum } from '@/app/types/domains/fileTypes';

// 导入组件用到的类型
import { FileType } from '@/app/components/features/file-management/navigation/types';
import { SearchType } from '@/app/hooks/file/useFileSearch';
import { FileWithSize } from '@/app/hooks/file/useFiles';

// 导入API客户端
import { fileApi } from '@/app/lib/api/file-api';

interface FileManagementPageProps {
  initialShowShares?: boolean;
}

export default function FileManagementPage({ initialShowShares = false }: FileManagementPageProps) {
  const router = useRouter();
  const { status } = useSession();
  
  // 获取用户资料相关状态，包括加载状态
  const { 
    userProfile, 
    effectiveAvatarUrl
  } = useProfile();

  // 使用主题UI管理hook (替换原来的useThemeManager和showThemePanel状态)
  const {
    currentTheme,
    updateTheme,
    showThemePanel,
    setShowThemePanel,
    toggleThemePanel
  } = useThemeUI();

  // 使用双状态加载管理
  const {
    isRefreshing  } = useLoadingState({
    initialLoad: true,
    minLoadingTime: 800
  });
  
  // 使用文件选择管理hook (替换原来的selectedFiles和disabledFolderIds状态)
  const {
    selectedFiles,
    disabledFolderIds,
    setSelectedFiles,
    updateDisabledFolderIds,
    handleFileCheckboxChange,
    selectAllFiles,
    deselectAllFiles,
    validateSelectionCount
  } = useFileSelection();
  
  // 使用useFiles钩子获取文件列表和相关操作
  const {
    files,
    isLoading: filesLoading,
    error: filesError,
    currentFolderId,
    folderPath,
    selectedFileType,
    sortOrder,
    fileUpdateTrigger,
    loadFiles,
    changeSort,
    filterByFileType,
    refreshCurrentFolder,
    handleFileClick,
    setCurrentFolderId,
    setFolderPath,
    setSelectedFileType,
    setSortOrder
  } = useFiles();

  // 使用收藏管理hook (替换原来的favoritedFileIds和favoriteModal相关状态)
  const {
    favoritedFileIds,
    favoriteModalVisible,
    selectedFileForFavorite,
    loadFavoritedFileIds,
    toggleFavorite,
    handleFavoriteSuccess,
    closeFavoriteModal
  } = useFavorites();

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
    showUploadDropdown,
    setShowUploadDropdown,
    uploadDropdownRef
  } = useUIState();

  // 使用文件夹创建钩子替换原有的模态窗口状态
  const {
    isCreateFolderModalOpen,
    openCreateFolderModal,
    closeCreateFolderModal,
    createFolder
  } = useFolderCreation();

  // 使用模态窗口状态管理
  const {
    isMoveModalOpen,
    isMoveLoading,
    isUploadModalOpen,
    isFolderUploadModalOpen,
    setIsMoveLoading,
    openMoveModal,
    closeMoveModal,
    closeUploadModal,
    closeFolderUploadModal,
    setIsUploadModalOpen,
    setIsFolderUploadModalOpen
  } = useModalState();

  // 使用文件分享管理（整合了原来的useFileShare和useShareLink）
  const {
    // 分享创建相关
    isShareModalOpen,
    openShareModal,
    closeShareModal,
    shareFiles,
    
    // 分享链接验证相关
    isLinkInputVisible,
    shareLink,
    shareLinkPassword,
    setShareLink,
    setShareLinkPassword,
    openLinkInputModal,
    closeLinkInputModal,
    handleLinkSubmit
  } = useShareManagement();

  // 使用视图状态管理
  const {
    currentView,
    showMySharesContent,
    showFavoritesContent,
    showRecentFilesContent,
    showRecentDownloadsContent,
    showSearchView,
    selectedFavoriteFolderId,
    isCreateFavoriteModalOpen,
    favoriteFoldersRefreshTrigger,
    setCurrentView,
    setShowSearchView,
    setIsCreateFavoriteModalOpen,
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
    fetchRecentDownloads,
  } = useRecentContent();

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
    downloadFiles: handleDownload,
    deleteFiles: handleDelete,
  } = useFileOperations([]);

  // 文件搜索钩子
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isLoading: searchLoading,
    searchType,
    setSearchType,
    enableRealTimeSearch,
    setEnableRealTimeSearch,
    handleSearch: executeSearchFn,
  } = useFileSearch();

  // 文件预览和重命名
  const {
    previewFile,
    handlePreview: handlePreviewFile,
    closePreview: handleClosePreview,
    isRenameModalOpen,
    setIsRenameModalOpen,
    fileToRename,
    renameFile: handleConfirmEdit,
    setFileToRename
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
    // 确保file是FileWithSize类型
    const fileWithSize: FileWithSize = {
      ...file,
      size: file.size || 0
    };
    
    if (file.isFolder) {
      // 如果是文件夹，导航到该文件夹
      handleFileClick(fileWithSize);
    } else {
      // 如果是文件，预览该文件
      handlePreviewFile(fileWithSize);
    }
  }, [handleFileClick, handlePreviewFile]);

  // 处理文件右键菜单
  const handleFileContextMenu = useCallback((event: React.MouseEvent, file: FileInfo) => {
    event.preventDefault();
    // TODO: 实现文件右键菜单
    console.log('File context menu', file);
  }, []);

  // 处理文件选择变化

  // 全选文件

  // 取消全选

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
    // 初始化加载收藏列表
    if (status === 'authenticated') {
      loadFavoritedFileIds();
    }
  }, [status, loadFavoritedFileIds]);

  // 处理切换收藏
  const handleToggleFavorite = useCallback((file: FileInfo, isFavorite: boolean) => {
    toggleFavorite(file, isFavorite);
    // 调用后可能需要刷新当前文件夹
    refreshCurrentFolder();
  }, [toggleFavorite, refreshCurrentFolder]);

  // 处理移动按钮点击
  const handleMoveButtonClick = useCallback(() => {
    if (!validateSelectionCount(1, undefined, '移动')) {
      return;
    }

    // 更新禁用的文件夹ID列表
    updateDisabledFolderIds(files);
    openMoveModal();
  }, [files, validateSelectionCount, updateDisabledFolderIds, openMoveModal]);

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
    if (!validateSelectionCount(1, undefined, '分享')) {
      return;
    }
    openShareModal(selectedFiles);
  }, [selectedFiles, validateSelectionCount, openShareModal]);

  // 处理重命名文件
  const handleRenameButtonClick = useCallback(() => {
    if (!validateSelectionCount(1, 1, '重命名')) {
      return;
    }

    const fileToEdit = files.find(file => file.id === selectedFiles[0]);
    if (!fileToEdit) {
      message.warning('找不到要重命名的文件');
      return;
    }
    
    // 打印调试信息以便追踪
    console.log('准备重命名文件:', {
      id: fileToEdit.id,
      name: fileToEdit.name,
      isFolder: fileToEdit.isFolder
    });
    
    // 先确保设置要重命名的文件，然后再打开模态框
    setFileToRename(fileToEdit);
    setIsRenameModalOpen(true);
  }, [selectedFiles, files, validateSelectionCount, setFileToRename, setIsRenameModalOpen]);

  // 处理搜索，封装executeSearchFn
  const handleSearch = useCallback(async (query?: string, type?: SearchType) => {
    // 确保搜索参数有效
    const effectiveQuery = query || '';
    const effectiveType = type || 'name';
    
    // 执行搜索操作
    console.log(`执行搜索: ${effectiveQuery}, 类型: ${effectiveType}`);
    
    // 调用搜索钩子的搜索函数
    await executeSearchFn(effectiveQuery, effectiveType);
  }, [executeSearchFn]);

  return (
    <>
      <Head>
        <title>文件管理 - Cloud Drive</title>
      </Head>
      
      <PageLayout 
        selectedFileType={selectedFileType as FileType}
        currentView={currentView as any}
        showThemePanel={showThemePanel}
        previewFile={previewFile}
        currentTheme={currentTheme || 'light'}
        searchType={searchType}
        favoriteFoldersRefreshTrigger={favoriteFoldersRefreshTrigger}
        onTypeClick={(type) => {
          // 先关闭所有特殊视图
          closeAllSpecialViews();
          // 设置当前视图 - 使用类型断言
          setCurrentView(type as any);
          // 清除当前路径，回到根目录
          setFolderPath([]);
          setCurrentFolderId(null);
          // 应用文件类型过滤 - 转换FileType为FileTypeEnum
          filterByFileType(type as unknown as FileTypeEnum);
          // 记录当前选择的类型，确保与侧边栏同步
          console.log('文件类型切换为:', type, '已重置面包屑路径');
        }}
        onSearchClick={(query, type) => {
          // 处理搜索点击，支持文件名搜索和标签搜索
          console.log(`处理搜索点击，查询: ${query}, 类型: ${type}`);
          
          // 调用视图状态钩子处理搜索视图，添加路径重置回调
          handleSearchClick(query, type as any, () => {
            // 清除当前路径，回到根目录
            setFolderPath([]);
            setCurrentFolderId(null);
          });
          
          // 设置搜索类型
          if (type === 'tag') {
            setSearchType('tag');
          } else {
            setSearchType('name');
          }
          
          // 如果有查询字符串，立即进行搜索
          if (query) {
            setSearchQuery(query);
            // 将字符串类型转换为要求的类型
            handleSearch(query, type as any);
          }
        }}
        onSharesClick={() => {
          handleViewMyShares(() => {
            // 清除当前路径，回到根目录
            setFolderPath([]);
            setCurrentFolderId(null);
          });
        }}
        onFavoritesClick={(folderId) => {
          handleFavoritesClick(folderId, () => {
            // 清除当前路径，回到根目录
            setFolderPath([]);
            setCurrentFolderId(null);
          });
        }}
        onCreateFavoriteFolder={handleCreateFavoriteFolder}
        onRecentClick={() => {
          handleRecentClick(() => {
            // 清除当前路径，回到根目录
            setFolderPath([]);
            setCurrentFolderId(null);
          });
          // 刷新最近访问文件
          fetchRecentFiles();
        }}
        onRecentDownloadsClick={() => {
          // 使用新的辅助函数，不再重复传递回调
          handleRecentDownloadsClick(() => {
            setFolderPath([]);
            setCurrentFolderId(null);
          });
          // 刷新最近下载文件列表
          fetchRecentDownloads();
        }}
        onThemeClick={() => {
          toggleThemePanel();
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
          uploadDropdownRef={uploadDropdownRef as React.RefObject<HTMLDivElement>}
          
          // 事件处理函数
          onBreadcrumbPathClick={handleBreadcrumbPathClick}
          onBreadcrumbBackClick={handleBreadcrumbBackClick}
          onClearFilter={handleClearFilter}
          closeAllSpecialViews={closeAllSpecialViews}
          onFileClick={(file) => {
            // 确保file是FileWithSize类型
            const fileWithSize: FileWithSize = {
              ...file,
              size: file.size || 0
            };
            handleFileClick(fileWithSize);
          }}
          onPreviewFile={(file) => {
            // 确保file是FileWithSize类型
            const fileWithSize: FileWithSize = {
              ...file,
              size: file.size || 0
            };
            handlePreviewFile(fileWithSize);
          }}
          onFileItemClick={handleFileItemClick}
          onFileCheckboxChange={handleFileCheckboxChange}
          onSelectAllFiles={() => selectAllFiles(files)}
          onDeselectAllFiles={deselectAllFiles}
          onToggleFavorite={handleToggleFavorite}
          onFileContextMenu={handleFileContextMenu}
          onDownload={handleDownload}
          onShare={handleShareButtonClick}
          onDelete={handleDelete}
          onRefreshFiles={handleRefreshFiles}
          onCreateFolder={handleCreateFolderClick}
          onRename={handleRenameButtonClick}
          onMove={handleMoveButtonClick}
          onSearch={(query, type) => handleSearch(query, type as any)}
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
        onUploadSuccess={handleUploadSuccess}
        withTags={true}
      />
      
      <UploadModal 
        isOpen={isFolderUploadModalOpen} 
        onClose={closeFolderUploadModal} 
        onSuccess={handleUploadSuccess}
        currentFolderId={currentFolderId}
        isFolderUpload={true}
        onUploadSuccess={handleUploadSuccess}
        withTags={true}
      />

      {/* 文件预览组件应该位于整个应用的最外层，确保它覆盖其他所有内容 */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          onClose={handleClosePreview}
          onDownload={() => {
            if (previewFile && previewFile.id) {
              handleDownload([previewFile.id]);
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
          const folderId = await createFolder(name, currentFolderId, tags);
          if (folderId) {
            await loadFiles(currentFolderId, selectedFileType, true);
          }
        }}
      />

      {/* 添加重命名模态窗口 */}
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
                // 刷新文件列表
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
      
      {/* 收藏夹选择框 */}
      <FavoriteModal
        fileId={selectedFileForFavorite?.id || ''}
        fileName={selectedFileForFavorite?.name || ''}
        visible={favoriteModalVisible}
        onClose={closeFavoriteModal}
        onSuccess={handleFavoriteSuccess}
      />
    </>
  );
}
       