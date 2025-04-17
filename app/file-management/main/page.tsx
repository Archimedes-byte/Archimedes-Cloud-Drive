// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { message, Spin } from 'antd';
import Head from 'next/head';

// 引入共享组件
import { Sidebar } from '@/app/components/features/file-management/navigation/sidebar';
import { Breadcrumb } from '@/app/components/features/file-management/navigation/breadcrumb';
import { FileList } from '@/app/components/features/file-management/file-list/file-list';
import { SkeletonPageLayout } from '@/app/components/features/file-management/shared/skeleton';
import { ErrorDisplay } from '@/app/components/features/file-management/shared/error-display';
import UploadModal from '@/app/components/features/file-management/upload/upload-modal';
import { FilePreview } from '@/app/components/features/file-management/file-preview/file-preview';
import { RenameModal } from '@/app/components/features/file-management/file-operations/rename-modal';
import { ThemePanel } from '@/app/components/ui/themes';

// 导入自定义组件
import MiniSidebar from '@/app/components/features/file-management/navigation/mini-sidebar';
import { TopActionBar } from '@/app/components/features/file-management/action-bar/top-action-bar';
import NewFolderForm from '@/app/components/features/file-management/folder-management/new-folder-form';
import { SearchView } from '@/app/components/features/file-management/search-view';
import FolderSelectModal from '@/app/components/features/file-management/folder-select/FolderSelectModal';

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

// 引入fileApi
import { fileApi } from '@/app/lib/api/file-api';

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
    updateFileInResults,
    clearSearchHistory
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

  // 添加以下状态
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [disabledFolderIds, setDisabledFolderIds] = useState<string[]>([]);
  const [isMoveLoading, setIsMoveLoading] = useState(false);
  
  // 添加刷新函数 - 移到这里与其他hooks一起声明
  const handleRefreshFiles = useCallback(() => {
    // 开始刷新加载状态
    startLoading(true);
    console.log('手动刷新文件列表');
    
    // 刷新当前文件夹内容
    loadFiles(currentFolderId, selectedFileType, true)
      .then(() => {
        console.log('手动刷新完成');
      })
      .catch(error => {
        console.error('手动刷新失败:', error);
        message.error('刷新失败，请稍后再试');
      })
      .finally(() => {
        finishLoading();
      });
  }, [currentFolderId, selectedFileType, loadFiles, startLoading, finishLoading]);

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
    
    console.log('文件上传成功，准备刷新文件列表');
    
    // 增加延迟时间，确保后端数据处理完成
    setTimeout(() => {
      console.log('开始刷新文件列表', {
        currentFolderId,
        selectedFileType,
        forceRefresh: true,
        timestamp: Date.now()  // 添加时间戳，用于排查问题
      });
      
      // 刷新文件列表，保持当前文件类型过滤，并强制刷新
      loadFiles(currentFolderId, selectedFileType, true)
        .then(() => {
          console.log('文件列表刷新成功，获取到文件数量:', files.length);
          // 再次检查，如果文件列表还是空的，尝试再次刷新
          if (files.length === 0) {
            console.log('文件列表为空，再次尝试刷新');
            setTimeout(() => loadFiles(currentFolderId, selectedFileType, true), 1000);
          }
          finishLoading();
        })
        .catch(error => {
          console.error('文件列表刷新失败:', error);
          // 尝试再次刷新
          setTimeout(() => loadFiles(currentFolderId, selectedFileType, true), 1000);
          finishLoading();
        });
    }, 1000); // 增加到1秒的延迟
  }, [currentFolderId, selectedFileType, loadFiles, startLoading, finishLoading, files.length]);

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
  const handleSearchClick = useCallback((searchTypeParam?: string) => {
    // 如果传入了搜索类型参数，设置对应的搜索类型
    if (searchTypeParam === 'tag') {
      setSearchType('tag');
    } else {
      // 如果没有指定类型，默认设置为按文件名搜索
      setSearchType('name');
    }
    
    // 重置搜索条件
    setSearchQuery('');
    
    // 清除文件类型过滤
    setSelectedFileType(null);
    
    // 显示搜索视图
    setShowSearchView(true);
  }, [setShowSearchView, setSearchType, setSearchQuery, setSelectedFileType]);

  // 处理文件点击
  const handleFileItemClick = useCallback((file) => {
    console.log('文件点击:', file);
    
    // 检查是否需要关闭搜索视图
    const isInSearch = showSearchView;
    
    if (file.isFolder) {
      // 如果是文件夹，使用导航逻辑
      handleFileClick(file);
      
      // 如果当前在搜索视图，则关闭搜索视图
      if (isInSearch) {
        console.log('从搜索结果点击文件夹，关闭搜索视图');
        setShowSearchView(false);
      }
    } else {
      // 如果是文件，查找本地文件并打开预览
      const localFile = files.find(f => f.id === file.id) || file;
      handlePreviewFile(localFile);
    }
  }, [files, handleFileClick, handlePreviewFile, showSearchView, setShowSearchView]);

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
    
    // 清除搜索内容和历史记录
    setSearchQuery('');
    clearSearchHistory();
    
    // 开始刷新加载状态
    startLoading(true);
    
    // 传递null类型参数以确保清除过滤，并强制刷新
    loadFiles(null, null, true)
      .finally(() => finishLoading());
  }, [setShowSearchView, setSelectedFileType, setCurrentFolderId, setFolderPath, startLoading, loadFiles, finishLoading, setSearchQuery, clearSearchHistory]);

  // 使用useCallback优化面包屑导航处理函数
  const handleBreadcrumbPathClick = useCallback((folderId: string | null) => {
    if (folderId === null) {
      setCurrentFolderId(null);
      setFolderPath([]);
      
      // 开始刷新加载状态
      startLoading(true);
      
      // 加载根目录文件，使用Promise.then代替finally以提高性能
      loadFiles(null, selectedFileType)
        .then(() => finishLoading())
        .catch((error) => {
          console.error('加载根目录文件出错:', error);
          finishLoading();
        });
    } else {
      // 查找用户点击的路径索引
      const index = folderPath.findIndex(p => p.id === folderId);
      if (index !== -1) {
        // 切断索引之后的部分
        const newPath = folderPath.slice(0, index + 1);
        
        // 优先更新UI状态，提升响应速度
        setFolderPath(newPath);
        setCurrentFolderId(folderId);
        
        // 开始加载状态
        startLoading(true);
        
        // 使用requestAnimationFrame确保UI更新后再加载文件
        requestAnimationFrame(() => {
          loadFiles(folderId, selectedFileType)
            .then(() => finishLoading())
            .catch((error) => {
              console.error('加载文件夹内容出错:', error);
              finishLoading();
            });
        });
      }
    }
  }, [folderPath, selectedFileType, loadFiles, startLoading, finishLoading]);
  
  // 使用useCallback优化后退按钮处理函数
  const handleBreadcrumbBackClick = useCallback(() => {
    if (folderPath.length > 0) {
      handleBackClick();
    }
  }, [folderPath, handleBackClick]);

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

  /**
   * 处理文件移动按钮点击
   */
  const handleMoveButtonClick = () => {
    if (selectedFiles.length === 0) {
      message.warning('请先选择要移动的文件');
      return;
    }
    
    // 检查是否选中了文件夹并设置禁用的文件夹列表
    const selectedFolders = files.filter(file => file.isFolder && selectedFiles.includes(file.id));
    if (selectedFolders.length > 0) {
      // 如果选中了文件夹，则需要禁用这些文件夹作为目标选择
      // 这是为了避免将文件夹移动到自己内部造成循环引用
      setDisabledFolderIds(selectedFolders.map(folder => folder.id));
    } else {
      setDisabledFolderIds([]);
    }
    
    // 打开移动弹窗
    setIsMoveModalOpen(true);
  };
  
  /**
   * 处理文件移动
   * @param targetFolderId 目标文件夹ID
   */
  const handleMove = async (targetFolderId: string) => {
    if (selectedFiles.length === 0) {
      message.warning('请选择要移动的文件');
      return;
    }
    
    try {
      setIsMoveLoading(true);
      
      // 记录移动前的状态和参数
      console.log('开始移动文件:', {
        selectedFiles,
        targetFolderId,
        currentFolderId,
        selectedFileType
      });
      
      // 调用文件操作API移动文件
      const result = await fileApi.moveFiles(selectedFiles, targetFolderId);
      
      console.log('文件移动成功，结果:', result);
      
      // 成功提示
      message.success(`成功移动 ${result?.movedCount || selectedFiles.length} 个文件`);
      
      // 清除选择 - 先清除选择，避免刷新时选中状态干扰
      setSelectedFiles([]);
      
      // 开始刷新加载状态
      startLoading(true);
      
      try {
        console.log('开始刷新文件列表', {
          currentFolderId,
          selectedFileType,
          timestamp: Date.now()
        });
        
        // 这里使用await确保在关闭弹窗前刷新完成
        await loadFiles(currentFolderId, selectedFileType, true);
        
        console.log('文件列表刷新完成');
        
        // 成功刷新后关闭弹窗
        setIsMoveModalOpen(false);
      } catch (refreshError) {
        console.error('刷新文件列表失败:', refreshError);
        message.warning('文件已移动，但刷新列表失败，请手动刷新');
        
        // 即使刷新失败也关闭弹窗，但保留移动成功状态，显示刷新按钮
        setIsMoveModalOpen(false);
      } finally {
        finishLoading();
      }
    } catch (error) {
      console.error('移动文件失败:', error);
      
      // 提取并显示详细错误信息
      let errorMessage = '移动文件失败';
      
      // 处理API错误
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // 针对常见错误提供更友好的提示
        if (error.message.includes('已存在') || error.message.includes('同名')) {
          errorMessage = '目标文件夹中已存在同名文件或文件夹，无法移动';
        } else if (error.message.includes('权限') || error.message.includes('access denied')) {
          errorMessage = '您没有权限将文件移动到此文件夹';
        } else if (error.message.includes('not found') || error.message.includes('不存在')) {
          errorMessage = '目标文件夹不存在或已被删除';
        }
      }
      
      // 显示错误信息
      message.error(errorMessage);
    } finally {
      setIsMoveLoading(false);
    }
  };

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
          onHomeClick={handleBreadcrumbPathClick}
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
                
                // 关闭搜索视图，确保显示文件列表
                setShowSearchView(false);
                
                // 清除搜索内容和历史记录
                setSearchQuery('');
                clearSearchHistory();
                
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
              onDownload={() => handleDownload(selectedFiles)}
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
              onMove={handleMoveButtonClick}
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
                onPathClick={handleBreadcrumbPathClick}
                onBackClick={handleBreadcrumbBackClick}
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
                    handlePreviewFile={handlePreviewFile}
                    onExitSearchView={() => {
                      // 清除搜索输入框和搜索记录
                      setSearchQuery('');
                      // 清空搜索结果
                      if (searchResults.length > 0) {
                        console.log('清除搜索结果');
                      }
                      
                      // 清空搜索历史记录
                      clearSearchHistory();
                      
                      // 关闭搜索视图
                      setShowSearchView(false);
                      
                      // 刷新文件列表，确保显示的是最新内容
                      startLoading(true);
                      loadFiles(currentFolderId, selectedFileType, true)
                        .finally(() => finishLoading());
                    }}
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
        onClose={() => setIsMoveModalOpen(false)}
        onConfirm={handleMove}
        currentFolderId={currentFolderId}
        disabledFolderIds={disabledFolderIds}
        isLoading={isMoveLoading}
        onRefresh={handleRefreshFiles}
      />
    </>
  );
}
       