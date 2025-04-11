'use client';

import React, { useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Spin, message } from 'antd';

// 导入共享组件
import { 
  Sidebar, 
  Breadcrumb, 
  FileList, 
  UploadModal, 
  SkeletonPageLayout,
  ErrorDisplay
} from '../components/shared';
import FilePreview from '../components/FilePreview';
import RenameModal from '../components/RenameModal';
import ThemePanel from '@/app/shared/themes/components/ThemePanel';

// 导入自定义组件
import MiniSidebar from '../components/MiniSidebar';
import TopActionBar from '../components/TopActionBar';
import NewFolderForm from '../components/NewFolderForm';
import { SearchView } from '../components/SearchView';

// 导入自定义 hooks - 使用基于全局状态的新hooks
import { useAppFiles } from '../hooks/useAppFiles';
import { useAppFileActions } from '../hooks/useAppFileActions';
import { useAppSearch } from '../hooks/useAppSearch';
import { useAppUserProfile } from '../hooks/useAppUserProfile';
import { useAppUIState } from '../hooks/useAppUIState';
import { useAppFilePreview } from '../hooks/useAppFilePreview';

// 导入样式
import styles from '../styles/shared.module.css';

/**
 * 文件管理主页面应用
 * 基于全局状态管理
 */
export default function FilesPageApp() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // 用户资料
  const { 
    userProfile, 
    isLoading: profileLoading, 
    error: profileError,
    effectiveAvatarUrl
  } = useAppUserProfile();

  // 文件状态和操作
  const {
    files,
    isLoading: filesLoading,
    error: filesError,
    currentFolderId,
    folderPath,
    selectedFileType,
    selectedFiles,
    sortOrder,
    loadFiles,
    setFileType,
    setSortOrder,
    setCurrentFolderId,
    setFolderPath,
    setSelectedFiles,
    handleFileClick,
    handleBackClick,
  } = useAppFiles();

  // 文件操作
  const {
    editingFile,
    editingName,
    editingTags,
    setEditingFile,
    setEditingName,
    setEditingTags,
    handleSelectFile,
    handleAddTag,
    handleRemoveTag,
    handleDownload,
    handleDelete,
    handleConfirmEdit,
    handleCreateFolder,
  } = useAppFileActions(() => loadFiles(currentFolderId, selectedFileType, true));

  // UI状态
  const {
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
  } = useAppUIState();

  // 搜索状态
  const {
    query: searchQuery,
    results: searchResults,
    isLoading: searchLoading,
    error: searchError,
    setSearchQuery,
    handleSearch
  } = useAppSearch();

  // 文件预览和重命名
  const {
    previewFile,
    fileToRename,
    isRenameModalOpen,
    setPreviewFile,
    setFileToRename,
    setIsRenameModalOpen,
    handlePreviewFile,
    handleClosePreview,
    handleRenameButtonClick,
    handleRenameFile
  } = useAppFilePreview(() => loadFiles(currentFolderId, selectedFileType, true));

  // 在文件上传成功后的处理函数
  const handleUploadSuccess = useCallback(() => {
    // 刷新文件列表，保持当前文件类型过滤，并强制刷新
    loadFiles(currentFolderId, selectedFileType, true);
  }, [currentFolderId, loadFiles, selectedFileType]);

  // 处理创建文件夹按钮点击
  const handleCreateFolderClick = useCallback(() => {
    setIsCreatingFolder(true);
  }, [setIsCreatingFolder]);

  // 处理清除过滤器
  const handleClearFilter = useCallback(() => {
    setShowSearchView(false);
    setFileType(null);
    setCurrentFolderId(null);
    setFolderPath([]);
    
    // 传递null类型参数以确保清除过滤，并强制刷新
    loadFiles(null, null, true);
  }, [loadFiles, setCurrentFolderId, setFileType, setFolderPath, setShowSearchView]);

  // 处理根目录点击
  const handleRootClick = useCallback(() => {
    setCurrentFolderId(null);
    setFolderPath([]);
    
    // 保持当前选中的文件类型，并强制刷新
    loadFiles(null, selectedFileType, true);
  }, [loadFiles, selectedFileType, setCurrentFolderId, setFolderPath]);

  // 监听会话状态变化进行重定向
  useEffect(() => {
    if (status === 'unauthenticated') {
      console.log('用户未认证，重定向到登录页面');
      router.replace('/auth/login');
    }
  }, [status, router]);

  // 初始加载文件列表
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      loadFiles(currentFolderId, selectedFileType);
    }
  }, [status, session, loadFiles, currentFolderId, selectedFileType]);

  // 处理加载中状态
  if (status === 'loading' || filesLoading) {
    return <SkeletonPageLayout />;
  }

  // 处理错误状态
  if (filesError) {
    return <ErrorDisplay message={filesError} onRetry={() => loadFiles(currentFolderId, selectedFileType, true)} />;
  }

  return (
    <div className={styles.appContainer}>
      {/* 侧边栏 */}
      {sidebarVisible ? (
        <Sidebar
          currentFolderId={currentFolderId}
          onFileTypeSelect={setFileType}
          selectedFileType={selectedFileType}
          myFilesExpanded={myFilesExpanded}
          quickAccessExpanded={quickAccessExpanded}
          setMyFilesExpanded={setMyFilesExpanded}
          setQuickAccessExpanded={setQuickAccessExpanded}
          onSearchClick={() => setShowSearchView(true)}
          avatarUrl={effectiveAvatarUrl}
          userName={userProfile?.name || session?.user?.name || '用户'}
          onThemeClick={() => setShowThemePanel(true)}
        />
      ) : (
        <MiniSidebar onExpand={() => setSidebarVisible(true)} />
      )}

      {/* 主内容区 */}
      <div className={styles.mainContent}>
        {/* 顶部操作栏 */}
        <TopActionBar
          sidebarVisible={sidebarVisible}
          onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
          onUploadClick={() => setIsUploadModalOpen(true)}
          onCreateFolderClick={handleCreateFolderClick}
          onFolderUploadClick={() => setIsFolderUploadModalOpen(true)}
          uploadDropdownRef={uploadDropdownRef}
          showUploadDropdown={showUploadDropdown}
          onDropdownToggle={() => setShowUploadDropdown(!showUploadDropdown)}
          selectedFiles={selectedFiles}
          onDeleteSelected={() => handleDelete(selectedFiles)}
          onSelectAllFiles={() => setSelectedFiles(files.map(f => f.id))}
          onDeselectAllFiles={() => setSelectedFiles([])}
          totalFiles={files.length}
        />

        {/* 面包屑导航 */}
        <Breadcrumb
          folderPath={folderPath}
          onBackClick={handleBackClick}
          onPathItemClick={(folderId) => {
            const index = folderPath.findIndex(item => item.id === folderId);
            if (index >= 0) {
              setCurrentFolderId(folderId);
              setFolderPath(folderPath.slice(0, index + 1));
              loadFiles(folderId, selectedFileType, true);
            }
          }}
          onRootClick={handleRootClick}
          onClearFilter={handleClearFilter}
          selectedFileType={selectedFileType}
        />

        {/* 搜索模式下显示搜索视图，否则显示文件列表 */}
        {showSearchView ? (
          <SearchView
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onSearch={handleSearch}
            searchResults={searchResults}
            loading={searchLoading}
            error={searchError}
            onClose={() => setShowSearchView(false)}
            onFileClick={handleFileClick}
            onSelectFile={handleSelectFile}
            selectedFiles={selectedFiles}
            onRenameClick={handleRenameButtonClick}
            onDownloadClick={handleDownload}
            onDeleteClick={(file) => handleDelete([file.id])}
          />
        ) : (
          <FileList
            files={files}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            onFileClick={handleFileClick}
            onCheckboxChange={handleSelectFile}
            selectedFiles={selectedFiles}
            onRenameClick={handleRenameButtonClick}
            onDownloadClick={handleDownload}
            onDeleteClick={(file) => handleDelete([file.id])}
          />
        )}
      </div>

      {/* 文件预览模态框 */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          onClose={handleClosePreview}
          onDownload={() => handleDownload(previewFile)}
        />
      )}

      {/* 重命名模态框 */}
      {isRenameModalOpen && fileToRename && (
        <RenameModal
          file={fileToRename}
          onClose={() => setIsRenameModalOpen(false)}
          onRename={handleRenameFile}
        />
      )}

      {/* 上传文件模态框 */}
      {(isUploadModalOpen || isFolderUploadModalOpen) && (
        <UploadModal
          open={isUploadModalOpen || isFolderUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            setIsFolderUploadModalOpen(false);
          }}
          currentFolderId={currentFolderId}
          onUploadSuccess={handleUploadSuccess}
          isFolderUpload={isFolderUploadModalOpen}
        />
      )}

      {/* 新建文件夹表单 */}
      {isCreatingFolder && (
        <NewFolderForm
          visible={isCreatingFolder}
          onClose={() => setIsCreatingFolder(false)}
          onSubmit={(name, tags) => handleCreateFolder(name, currentFolderId, tags)}
          parentFolderId={currentFolderId}
        />
      )}

      {/* 主题选择面板 */}
      {showThemePanel && (
        <ThemePanel
          visible={showThemePanel}
          onClose={() => setShowThemePanel(false)}
        />
      )}
    </div>
  );
} 