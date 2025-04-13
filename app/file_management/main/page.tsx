// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import ThemePanel from '@/app/shared/themes/components/ThemePanel';

// 导入自定义组件
import MiniSidebar from '../components/MiniSidebar';
import TopActionBar from '../components/TopActionBar';
import NewFolderForm from '../components/NewFolderForm';
import { SearchView } from '../components/SearchView';

// 导入自定义 hooks
import { 
  useFiles, 
  useFileOperations, 
  useFileUpload, 
  useFileSearch, 
  useFilePreview,
  useLoadingState, 
  useUIState, 
  useThemeManager, 
  useProfile 
} from '@/app/hooks';
// 导入类型和工具函数
import { SortOrder, FileInfo } from '@/app/types';
import { convertFilesForDisplay } from '@/app/utils/file/converter';

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

  // 添加主题面板状态
  const [showThemePanel, setShowThemePanel] = useState(false);

  // 文件操作钩子
  const {
    createFolder: handleCreateFolder,
    downloadFiles: handleDownload,
    deleteFiles: handleDelete,
    renameFile: handleRenameFile,
    isLoading: fileOperationsLoading,
    error: fileOperationsError
  } = useFileOperations([]);

  // 先调用文件搜索钩子，确保updateFileInResults可用
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isLoading: searchLoading,
    error: searchError,
    showSearchView,
    setShowSearchView,
    searchType,
    setSearchType,
    enableRealTimeSearch,
    setEnableRealTimeSearch,
    debounceDelay,
    setDebounceDelay,
    handleSearch,
    updateFileInResults
  } = useFileSearch();

  // 文件预览和重命名 - 传入selectedFileType参数
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
  } = useFilePreview({
    onRefresh: () => loadFiles(currentFolderId, selectedFileType, true),
    onFileUpdate: handleFileUpdate,  // 传入文件更新处理函数
    onSearchResultsUpdate: updateFileInResults,  // 传入搜索结果更新函数
    selectedFileType  // 传入当前选择的文件类型
  });

  // 添加创建文件夹相关状态
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderTags, setNewFolderTags] = useState<string[]>([]);
  const [editingFile, setEditingFile] = useState<any>(null);
  const [editingName, setEditingName] = useState('');
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);

  // 文件上下文菜单处理 - 移至hooks声明区域
  const handleFileContextMenu = useCallback((e, file, setSelectedFile, setSelectedFiles) => {
    // 阻止默认右键菜单
    e?.preventDefault();
    e?.stopPropagation();
    
    if (file) {
      // 设置当前选中的文件
      setSelectedFile?.(file);
      
      // 如果是单击选择，只选择当前文件
      if (e?.type === 'contextmenu') {
        setSelectedFiles?.([file.id]);
      }
      
      // 如果是文件（不是文件夹），可以设置为要重命名的文件
      if (!file.isFolder) {
        setFileToRename(file);
      }
    }
  }, [setFileToRename]);

  // 标签相关处理函数
  const handleAddTag = useCallback((tag: string) => {
    if (editingFile) {
      setEditingTags(prev => [...prev, tag]);
    } else {
      setNewFolderTags(prev => [...prev, tag]);
    }
    setNewTag('');
  }, [editingFile]);

  const handleRemoveTag = useCallback((tag: string) => {
    if (editingFile) {
      setEditingTags(prev => prev.filter(t => t !== tag));
    } else {
      setNewFolderTags(prev => prev.filter(t => t !== tag));
    }
  }, [editingFile]);

  // 状态跟踪引用
  const hasLoadedFilesRef = React.useRef(false);
  const sessionInitializedRef = React.useRef(false);
  // 添加防止重复加载的标志，放在顶层
  const loadInProgressRef = useRef(false);

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
  const onFileCheckboxChange = useCallback((file: FileInfo, checked: boolean) => {
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
    if (status === 'authenticated' && session?.user && !hasLoadedFilesRef.current && !loadInProgressRef.current) {
      console.log('初始加载文件列表', { currentFolderId, selectedFileType, session: !!session });
      
      // 标记已经开始加载
      hasLoadedFilesRef.current = true;
      loadInProgressRef.current = true;
      
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
                  loadInProgressRef.current = false;
                })
                .catch(error => {
                  console.error('加载文件列表失败:', error);
                  finishLoading(true, '加载文件列表失败');
                  loadInProgressRef.current = false;
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
                        loadInProgressRef.current = false;
                      })
                      .catch(error => {
                        console.error('加载文件列表失败:', error);
                        finishLoading(true, '加载文件列表失败');
                        loadInProgressRef.current = false;
                      });
                  } else {
                    console.error('重试获取用户资料失败');
                    loadInProgressRef.current = false;
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
                      .then(() => {
                        finishLoading(false);
                        loadInProgressRef.current = false;
                      })
                      .catch(err => {
                        finishLoading(true, '加载文件列表失败');
                        loadInProgressRef.current = false;
                      });
                  } else {
                    finishLoading(true, '获取用户资料失败，请刷新页面重试');
                    loadInProgressRef.current = false;
                  }
                })
                .catch(err => {
                  finishLoading(true, err.message || '加载失败，请重试');
                  loadInProgressRef.current = false;
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
          currentTheme={currentTheme}
          onThemeClick={() => {
            // 切换主题面板显示状态，同时关闭其他面板
            setShowThemePanel(!showThemePanel);
            // 如果打开主题面板，关闭搜索和文件预览
            if (!showThemePanel) {
              setShowSearchView(false);
              if (previewFile) {
                handleClosePreview();
              }
            }
          }}
        />

        {/* 侧边栏 - 仅在非主题模式下显示 */}
        {sidebarVisible && !showThemePanel && (
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

        {/* 根据视图状态显示不同内容 */}
        {showThemePanel ? (
          /* 主题设置视图 */
          <ThemePanel 
            currentTheme={currentTheme}
            onThemeChange={async (themeId) => {
              const success = await updateTheme(themeId);
              return success;
            }}
            onClose={() => setShowThemePanel(false)}
          />
        ) : (
          /* 文件管理视图 */
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
              onRename={() => {
                // 如果选中了多个文件，提示用户一次只能重命名一个文件
                if (selectedFiles.length > 1) {
                  message.warning('一次只能重命名一个文件');
                  return;
                }
                
                // 如果选中了一个文件，找到该文件并打开重命名对话框
                if (selectedFiles.length === 1) {
                  const selectedFile = files.find(file => file.id === selectedFiles[0]);
                  if (selectedFile) {
                    console.log('打开重命名对话框，文件:', {
                      id: selectedFile.id,
                      name: selectedFile.name,
                      isFolder: selectedFile.isFolder
                    });
                    handleRenameButtonClick(selectedFile);
                  } else {
                    message.warning('未找到选中的文件');
                  }
                } else {
                  message.warning('请先选择要重命名的文件');
                }
              }}
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
                    enableRealTimeSearch={enableRealTimeSearch}
                    setEnableRealTimeSearch={setEnableRealTimeSearch}
                    debounceDelay={debounceDelay}
                    setDebounceDelay={setDebounceDelay}
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
                      onCreateFolder={() => {
                        // 先判断文件夹名称是否为空
                        if (!newFolderName || !newFolderName.trim()) {
                          return; // 如果为空，直接返回
                        }
                        
                        console.log('开始创建文件夹:', newFolderName);
                        
                        // 确保传递名称和标签
                        handleCreateFolder(newFolderName, currentFolderId, newFolderTags)
                          .then(folderId => {
                            console.log('文件夹创建返回ID:', folderId);
                            
                            // 只要返回值不是null，就认为是成功的
                            if (folderId !== null) {
                              console.log('文件夹创建成功，准备刷新');
                              // 创建成功，关闭表单并刷新
                              setIsCreatingFolder(false);
                              setNewFolderName('');
                              setNewFolderTags([]);
                              
                              // 刷新当前文件夹
                              loadFiles(currentFolderId, selectedFileType, true)
                                .then(() => {
                                  console.log('文件列表刷新完成');
                                })
                                .catch(err => {
                                  console.error('刷新文件列表失败:', err);
                                });
                            } else {
                              console.error('创建文件夹失败，API返回null');
                            }
                          })
                          .catch(error => {
                            console.error('创建文件夹请求出错:', error);
                          });
                      }}
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
                    onFileSelect={(file, checked) => onFileCheckboxChange(file as FileInfo, checked)}
                    onSelectAll={onSelectAllFiles}
                    onDeselectAll={onDeselectAllFiles}
                    selectedFiles={selectedFiles}
                    onFileContextMenu={(e, file) => handleFileContextMenu(e, file, setSelectedFile, setSelectedFiles)}
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
        )}
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
        onRename={(newName, tags) => {
          if (!fileToRename) {
            message.warning('未选择要重命名的文件');
            return;
          }
          
          console.log('准备重命名文件:', {
            id: fileToRename.id,
            name: fileToRename.name,
            newName: newName,
            tagsCount: tags?.length || 0
          });
          
          // 使用useFilePreview的renameFile函数
          handleConfirmEdit(newName, tags)
            .then(success => {
              if (success) {
                console.log('重命名成功，刷新文件列表');
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
          onDownload={handleDownload}
        />
      )}
    </>
  );
}
       