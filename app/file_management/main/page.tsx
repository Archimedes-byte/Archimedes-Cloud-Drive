// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { message, Spin } from 'antd';
import Head from 'next/head';

// 引入共享组件
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

// 导入自定义组件
import MiniSidebar from '../components/MiniSidebar';
import TopActionBar from '../components/TopActionBar';
import NewFolderForm from '../components/NewFolderForm';
import { SearchView } from '../components/SearchView';

// 导入自定义 hooks
import { useFiles } from '../hooks/useFiles';
import { useFileActions } from '../hooks/useFileActions';
import { useSearch } from '../hooks/useSearch';
import { useUserProfile } from '../hooks/useUserProfile';
import { useLoadingState } from '../hooks/useLoadingState';
import { useUIState } from '../hooks/useUIState';
import { useFilePreviewAndRename } from '../hooks/useFilePreviewAndRename';
import { useThemeManager } from '../hooks/useThemeManager';

// 导入类型和工具函数
import { SortOrder } from '@/app/types';
import { LocalFileType, convertFilesForDisplay } from '../utils/fileTypeConverter';

// 导入样式
import styles from '../styles/shared.module.css';

export default function FileManagementPage() {
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
  } = useUserProfile();

  // 使用主题管理hook
  const { currentTheme } = useThemeManager();

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
  
  // 引用文件相关hooks
  const { 
    files, isLoading: filesLoading, error: filesError, currentFolderId, setCurrentFolderId, 
    folderPath, setFolderPath, selectedFileType, setSelectedFileType,
    sortOrder, setSortOrder, loadFiles, handleFileClick, handleBackClick
  } = useFiles();

  // UI状态管理
  const {
    sidebarVisible,
    myFilesExpanded,
    quickAccessExpanded,
    isUploadModalOpen,
    isFolderUploadModalOpen,
    showUploadDropdown,
    setSidebarVisible,
    setMyFilesExpanded,
    setQuickAccessExpanded,
    setIsUploadModalOpen,
    setIsFolderUploadModalOpen,
    setShowUploadDropdown,
    uploadDropdownRef
  } = useUIState();

  // 文件操作钩子
  const {
    selectedFiles, setSelectedFiles, editingFile, setEditingFile,
    editingName, setEditingName, editingTags, setEditingTags,
    isCreatingFolder, setIsCreatingFolder, newFolderName, setNewFolderName,
    newFolderTags, setNewFolderTags, handleDownload, handleDelete,
    handleConfirmEdit, handleCreateFolder, handleSelectFile,
    handleAddTag, handleRemoveTag
  } = useFileActions(() => loadFiles(currentFolderId, selectedFileType, true));

  // 文件预览和重命名
  const {
    previewFile, isRenameModalOpen, fileToRename,
    setPreviewFile, handleClosePreview, handlePreviewFile,
    setIsRenameModalOpen, setFileToRename, 
    handleRenameFile, handleRenameButtonClick, handleFileContextMenu
  } = useFilePreviewAndRename({
    loadFiles: (folderId, fileType) => loadFiles(folderId, fileType, true),
    currentFolderId,
    selectedFileType
  });

  // 搜索钩子
  const {
    showSearchView, setShowSearchView, searchQuery, setSearchQuery,
    searchResults, searchType, setSearchType,
    searchLoading, searchError, handleSearch
  } = useSearch();

  // 其他独立状态
  const [newTag, setNewTag] = useState('');
  const [selectedFile, setSelectedFile] = useState<LocalFileType | null>(null);
  
  // 状态跟踪引用
  const hasLoadedFilesRef = React.useRef(false);
  const sessionInitializedRef = React.useRef(false);

  // 在文件上传或文件夹上传成功后触发的函数
  const handleUploadSuccess = useCallback(() => {
    // 开始刷新加载状态
    startLoading(true);
    
    // 刷新文件列表，保持当前文件类型过滤，并强制刷新
    loadFiles(currentFolderId, selectedFileType, true).finally(() => {
      finishLoading();
    });
  }, [currentFolderId, loadFiles, selectedFileType, startLoading, finishLoading]);

  // 处理创建文件夹按钮点击
  const handleCreateFolderClick = useCallback(() => {
    setIsCreatingFolder(true);
  }, [setIsCreatingFolder]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut({ 
        callbackUrl: '/',
        redirect: true 
      });
    } catch (error) {
      console.error('退出时发生错误:', error);
      // 如果发生错误，尝试强制跳转到首页
      window.location.href = '/';
    }
  }, []);

  // Sidebar中"搜索文件"点击处理函数
  const handleSearchClick = useCallback(() => {
    setShowSearchView(true);
  }, [setShowSearchView]);

  // 处理文件点击
  const handleFileItemClick = useCallback((file) => {
    const localFile = files.find(f => f.id === file.id);
    if (!localFile) return;

    if (localFile.isFolder) {
      // 如果是文件夹，继续使用原有的导航逻辑
      handleFileClick(localFile);
    } else {
      // 如果是文件，打开预览
      handlePreviewFile(localFile);
    }
  }, [files, handleFileClick, handlePreviewFile]);

  // 处理全选文件
  const onSelectAllFiles = useCallback(() => {
    setSelectedFiles(files.map(file => file.id));
  }, [files, setSelectedFiles]);

  // 处理取消全选
  const onDeselectAllFiles = useCallback(() => {
    setSelectedFiles([]);
  }, [setSelectedFiles]);

  // 处理文件复选框变化
  const onFileCheckboxChange = useCallback((file: LocalFileType, checked: boolean) => {
    handleSelectFile(file.id, checked);
  }, [handleSelectFile]);

  // 处理返回根目录/清除过滤器 - 移到这里
  const handleClearFilter = useCallback(() => {
    setShowSearchView(false);
    setSelectedFileType(null);
    setCurrentFolderId(null);
    setFolderPath([]);
    
    // 开始刷新加载状态
    startLoading(true);
    
    // 传递null类型参数以确保清除过滤，并强制刷新
    loadFiles(null, null, true)
      .finally(() => finishLoading());
  }, [setShowSearchView, setSelectedFileType, setCurrentFolderId, setFolderPath, startLoading, loadFiles, finishLoading]);

  // 处理根目录点击 - 移到这里
  const handleRootClick = useCallback(() => {
    setCurrentFolderId(null);
    setFolderPath([]);
    
    // 开始刷新加载状态
    startLoading(true);
    
    // 保持当前选中的文件类型，并强制刷新
    loadFiles(null, selectedFileType, true)
      .finally(() => finishLoading());
  }, [setCurrentFolderId, setFolderPath, startLoading, loadFiles, selectedFileType, finishLoading]);

  // 重定向逻辑优化
  useEffect(() => {
    // 只在状态确定时执行，避免初始loading状态触发重定向
    if (status === 'unauthenticated') {
      console.log('用户未认证，重定向到登录页面');
      router.replace('/auth/login');
    } else if (status === 'authenticated') {
      console.log('用户已认证，确认会话状态');
      sessionInitializedRef.current = true;
    }
  }, [status, router]);

  // 文件加载逻辑优化
  useEffect(() => {
    // 确保session存在且状态为已认证，且文件未加载过
    if (status === 'authenticated' && session?.user && !hasLoadedFilesRef.current) {
      console.log('初始加载文件列表', { currentFolderId, selectedFileType, session: !!session });
      
      // 标记已经开始加载
      hasLoadedFilesRef.current = true;
      
      // 开始加载，这是初始加载，使用骨架屏
      startLoading(false);
      
      // 添加延迟，确保session完全初始化
      setTimeout(() => {
        // 修改为先加载用户资料，成功后再加载文件列表
        fetchUserProfile()
          .then(userProfileData => {
            if (userProfileData) {
              console.log('用户资料加载成功，继续加载文件列表');
              // 只有在用户资料加载成功后才加载文件列表，并强制刷新
              return loadFiles(currentFolderId, selectedFileType, true)
                .then(() => {
                  console.log('文件列表加载成功，完成初始化加载');
                  finishLoading(false);
                });
            } else {
              console.log('用户资料为空，尝试重新获取...');
              // 增加重试延迟，确保session稳定
              return new Promise(resolve => setTimeout(resolve, 1000))
                .then(() => fetchUserProfile(true)) // 强制刷新模式
                .then(retryProfileData => {
                  if (retryProfileData) {
                    console.log('重试获取用户资料成功，继续加载文件列表');
                    return loadFiles(currentFolderId, selectedFileType, true)
                      .then(() => {
                        console.log('文件列表加载成功，完成初始化加载');
                        finishLoading(false);
                      });
                  } else {
                    console.error('重试获取用户资料失败');
                    throw new Error("获取用户资料失败，请刷新页面重试");
                  }
                });
            }
          })
          .catch((error) => {
            console.error('加载过程出错:', error);
            // 再次尝试获取用户资料，加强容错性
            setTimeout(() => {
              console.log('最后一次尝试获取用户资料...');
              fetchUserProfile(true)
                .then(lastTryProfile => {
                  if (lastTryProfile) {
                    console.log('最后尝试成功，继续加载文件列表');
                    loadFiles(currentFolderId, selectedFileType, true)
                      .then(() => finishLoading(false))
                      .catch(err => finishLoading(true, '加载文件列表失败'));
                  } else {
                    finishLoading(true, '获取用户资料失败，请刷新页面重试');
                  }
                })
                .catch(err => {
                  finishLoading(true, err.message || '加载失败，请重试');
                });
            }, 1500);
          });
      }, 500); // 短暂延迟，等待session稳定
    }
  }, [status, session, currentFolderId, selectedFileType, loadFiles, fetchUserProfile, startLoading, finishLoading]);

  // 初始化Lucide图标
  useEffect(() => {
    // @ts-ignore
    window.lucide?.createIcons();
  }, []);
  
  // 计算所有文件是否全部选中
  const areAllFilesSelected = files.length > 0 && selectedFiles.length === files.length;

  // 使用初始化加载状态显示骨架屏
  if (isInitialLoading) {
    console.log('显示骨架屏加载状态');
    return <SkeletonPageLayout />;
  }

  // 如果用户状态正在加载，显示更简单的加载提示
  if (status === 'loading') {
    console.log('显示用户认证加载状态');
    return (
      <div className={styles.loading}>
        <div className={styles.loadingCard}>
          <div className={styles.loadingSpinner}></div>
          <h3 className={styles.loadingTitle}>正在加载</h3>
          <p className={styles.loadingText}>请稍候，正在验证您的身份...</p>
        </div>
      </div>
    );
  }

  // 修改错误处理逻辑，使用新的ErrorDisplay组件
  if (isLoadingError) {
    console.log('显示错误状态，原因:', loadingError);
    
    // 根据错误信息判断错误类型
    let errorType: 'network' | 'auth' | 'server' | 'data' | 'timeout' | 'unknown' = 'unknown';
    
    if (loadingError) {
      if (loadingError.includes('网络') || loadingError.includes('连接')) {
        errorType = 'network';
      } else if (loadingError.includes('超时')) {
        errorType = 'timeout';
      } else if (loadingError.includes('服务器')) {
        errorType = 'server';
      } else if (loadingError.includes('数据') || loadingError.includes('资料')) {
        errorType = 'data';
      } else if (loadingError.includes('认证') || loadingError.includes('登录')) {
        errorType = 'auth';
      }
    }
    
    return (
      <ErrorDisplay 
        errorType={errorType}
        message={loadingError || "请刷新页面重试或联系管理员"}
        onRetry={() => {
          startLoading(false);
          fetchUserProfile(true)
            .then(() => {
              return loadFiles(currentFolderId, selectedFileType, true);
            })
            .then(() => finishLoading())
            .catch((err) => finishLoading(true, err.message));
        }}
      />
    );
  }

  // 添加一个额外的检查，如果用户资料仍在加载中，继续显示骨架屏
  if (profileLoading) {
    console.log('用户资料状态: 仍在加载中', { profileLoading });
    return <SkeletonPageLayout />;
  }
  
  // 单独检查用户资料是否存在
  if (!userProfile) {
    console.log('用户资料状态: 未获取到用户资料', { hasProfile: false });
    return <SkeletonPageLayout />;
  }

  return (
    <>
      <Head>
        <title>文件管理 - 云盘</title>
      </Head>
      
      <div className={styles.fileManagementContainer}>
        {/* Mini侧边栏 */}
        <MiniSidebar 
          avatarUrl={effectiveAvatarUrl}
          userName={userProfile?.name}
          userEmail={userProfile?.email}
          onHomeClick={handleRootClick}
          onLogoutClick={handleSignOut}
          onAvatarClick={() => {
            router.push('/dashboard');
          }}
        />

        {/* 侧边栏 */}
        {sidebarVisible && (
          <div className={styles.sidebarContainer}>
            <Sidebar
              selectedFileType={selectedFileType}
              onTypeClick={(type) => {
                console.log('侧边栏类型点击:', type);
                
                // 开始刷新加载状态
                startLoading(true);
                
                // 先更新状态
                setSelectedFileType(type);
                setCurrentFolderId(null);
                setFolderPath([]);
                
                // 使用新的参数传递方式，直接传入点击的类型
                loadFiles(null, type)
                  .finally(() => finishLoading());
              }}
              onSearchClick={handleSearchClick}
            />
          </div>
        )}

        {/* 主内容区域 */}
        <div className={styles.mainContent}>
          {/* 当内容刷新加载时显示局部加载状态 */}
          {isRefreshing && (
            <div className={styles.refreshingOverlay}>
              <Spin tip="正在刷新..." />
            </div>
          )}
          
          {/* 顶部操作栏 */}
          <TopActionBar 
            selectedFiles={selectedFiles}
            onClearSelection={() => setSelectedFiles([])}
            onDownload={handleDownload}
            onRename={() => handleRenameButtonClick(files, selectedFiles)}
            onMove={() => {}}
            onDelete={handleDelete}
            onClearFilter={handleClearFilter}
            onCreateFolder={handleCreateFolderClick}
            selectedFileType={selectedFileType}
            showSearchView={showSearchView}
            isInRootFolder={!currentFolderId && !selectedFileType && !showSearchView}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            showUploadDropdown={showUploadDropdown}
            setShowUploadDropdown={setShowUploadDropdown}
            setIsUploadModalOpen={setIsUploadModalOpen}
            setIsFolderUploadModalOpen={setIsFolderUploadModalOpen}
            uploadDropdownRef={uploadDropdownRef}
          />
          
          {/* 面包屑导航栏 */}
          <div className={styles.breadcrumbBar}>
            <Breadcrumb 
              folderPath={folderPath} 
              showHome={true}
              onPathClick={(folderId) => {
                if (folderId === null) {
                  setCurrentFolderId(null);
                  setFolderPath([]);
                  
                  // 开始刷新加载状态
                  startLoading(true);
                  
                  loadFiles(null, selectedFileType)
                    .finally(() => finishLoading());
                } else {
                  // 查找用户点击的路径索引
                  const index = folderPath.findIndex(p => p.id === folderId);
                  if (index !== -1) {
                    // 切断索引之后的部分
                    const newPath = folderPath.slice(0, index + 1);
                    setFolderPath(newPath);
                    setCurrentFolderId(folderId);
                    
                    // 开始刷新加载状态
                    startLoading(true);
                    
                    loadFiles(folderId, selectedFileType)
                      .finally(() => finishLoading());
                  }
                }
              }}
              onBackClick={() => {
                if (folderPath.length > 0) {
                  handleBackClick();
                }
              }}
            />
          </div>

          {/* 搜索视图或文件列表视图 */}
          <div className={styles.fileListWrapper}>
            {showSearchView ? (
              <div className="search-view-container">
                <SearchView 
                  searchType={searchType}
                  setSearchType={setSearchType}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  searchResults={searchResults}
                  isLoading={searchLoading}
                  error={searchError}
                  handleSearch={handleSearch}
                  handleFileClick={handleFileItemClick}
                />
              </div>
            ) : (
              // 文件列表
              <>
                {isCreatingFolder && (
                  <NewFolderForm 
                    folderName={newFolderName}
                    setFolderName={setNewFolderName}
                    folderTags={newFolderTags}
                    setFolderTags={setNewFolderTags}
                    onCreateFolder={() => handleCreateFolder(currentFolderId)}
                    onCancel={() => {
                      setIsCreatingFolder(false);
                      setNewFolderName('');
                      setNewFolderTags([]);
                    }}
                  />
                )}

                {/* 文件列表组件 */}
                <FileList 
                  files={convertFilesForDisplay(files)}
                  onFileClick={handleFileItemClick}
                  onFileSelect={(file, checked) => onFileCheckboxChange(file as LocalFileType, checked)}
                  onSelectAll={onSelectAllFiles}
                  onDeselectAll={onDeselectAllFiles}
                  selectedFiles={selectedFiles}
                  onFileContextMenu={(e, file) => handleFileContextMenu(e, file as LocalFileType, setSelectedFile, setSelectedFiles)}
                  onBackClick={folderPath.length > 0 ? handleBackClick : undefined}
                  isLoading={filesLoading}
                  error={filesError}
                  editingFile={editingFile}
                  editingName={editingName}
                  editingTags={editingTags}
                  onEditNameChange={setEditingName}
                  onConfirmEdit={handleConfirmEdit}
                  onCancelEdit={() => setEditingFile(null)}
                  onAddTag={handleAddTag}
                  onRemoveTag={handleRemoveTag}
                  newTag={newTag}
                  onNewTagChange={setNewTag}
                  showCheckboxes={true}
                  areAllSelected={areAllFilesSelected}
                />
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* 上传模态窗口 */}
      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onSuccess={handleUploadSuccess}
        currentFolderId={currentFolderId}
        isFolderUpload={false}
      />
      
      <UploadModal 
        isOpen={isFolderUploadModalOpen} 
        onClose={() => setIsFolderUploadModalOpen(false)} 
        onSuccess={handleUploadSuccess}
        currentFolderId={currentFolderId}
        isFolderUpload={true}
      />

      {/* 重命名模态窗口 */}
      <RenameModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        onRename={handleRenameFile}
        initialName={fileToRename?.name || ''}
        initialTags={fileToRename?.tags || []}
        fileType={fileToRename?.isFolder ? 'folder' : 'file'}
      />

      {/* 文件预览组件应该位于整个应用的最外层，确保它覆盖其他所有内容 */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          onClose={handleClosePreview}
          onDownload={handleDownload}
        />
      )}
    </>
  );
}
       