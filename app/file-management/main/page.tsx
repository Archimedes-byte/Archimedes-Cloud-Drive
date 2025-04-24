// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { message, Spin, Input, Modal, Button, Divider, Dropdown, Tag } from 'antd';
import Head from 'next/head';
import { FolderUp, UploadCloud, FileUp, FolderPlus, Folder, FileText, Image as ImageIcon, Video, Music, File, Search, ChevronUp, ChevronDown, X, Zap, Download, Clock, Share2, Star, Tag as TagIcon } from 'lucide-react';

// 引入共享组件
import { Sidebar } from '@/app/components/features/file-management/navigation/sidebar';
import { Breadcrumb } from '@/app/components/features/file-management/navigation/breadcrumb';
import { FileList } from '@/app/components/features/file-management/file-list/file-list';
import { SkeletonPageLayout } from '@/app/components/features/file-management/shared/skeleton/Skeleton';
import { ErrorDisplay } from '@/app/components/features/file-management/shared/error-display';
import UploadModal from '@/app/components/features/file-management/upload/upload-modal';
import { FilePreview } from '@/app/components/features/file-management/file-preview/file-preview';
import { RenameModal } from '@/app/components/features/file-management/file-operations/rename-modal';
import { ThemePanel } from '@/app/components/ui/themes';

// 导入自定义组件
import MiniSidebar from '@/app/components/features/file-management/navigation/mini-sidebar';
import { TopActionBar } from '@/app/components/features/file-management/action-bar/top-action-bar';
import { SearchView } from '@/app/components/features/file-management/search-view';
import FolderSelectModal from '@/app/components/features/file-management/folder-select/FolderSelectModal';
import { FavoritesContent } from '@/app/components/features/file-management/favorites';
import { MySharesContent } from '@/app/components/features/file-management/share';
import { CreateFavoriteModal } from '@/app/components/features/file-management/favorite';
import { CreateFolderModal } from '@/app/components/features/file-management/folder-management/create-folder-modal';

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
  useProfile,
  useFileShare
} from '@/app/hooks';
// 导入类型和工具函数
import { SortOrder, FileInfo } from '@/app/types';
import { convertFilesForDisplay } from '@/app/utils/file/converter';

// 导入样式
import styles from '../styles/shared.module.css';

// 引入fileApi
import { fileApi } from '@/app/lib/api/file-api';

// 在import部分添加ShareModal组件导入
import { ShareModal } from '@/app/components/features/file-management/sharing';

// 在组件内部添加分享相关状态和功能
interface FileManagementPageProps {
  initialShowShares?: boolean;
}

// 添加文件名冲突检查API
import { checkFileNameConflicts } from '@/app/lib/api/file-service';

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

  // 使用UI状态管理
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
  
  // 添加状态变量来跟踪是否显示特殊视图内容
  const [showMySharesContent, setShowMySharesContent] = useState(initialShowShares);
  const [showFavoritesContent, setShowFavoritesContent] = useState(false);
  const [showRecentFilesContent, setShowRecentFilesContent] = useState(false);
  const [showRecentDownloadsContent, setShowRecentDownloadsContent] = useState(false);
  const [currentView, setCurrentView] = useState<string | null>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [tagSearchOpen, setTagSearchOpen] = useState(false);
  const [selectedFavoriteFolderId, setSelectedFavoriteFolderId] = useState<string | undefined>();
  const [isCreateFavoriteModalOpen, setIsCreateFavoriteModalOpen] = useState(false);
  const [favoriteFoldersRefreshTrigger, setFavoriteFoldersRefreshTrigger] = useState(0);

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
    clearSearchHistory,
    searchHistory
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

  // 文件分享钩子
  const {
    isShareModalOpen,
    setIsShareModalOpen,
    selectedFilesForShare,
    shareFiles,
    openShareModal,
    closeShareModal
  } = useFileShare();

  // 链接输入框状态
  const [isLinkInputVisible, setIsLinkInputVisible] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareLinkPassword, setShareLinkPassword] = useState('');
  const linkInputRef = useRef<Input>(null);

  // 添加创建文件夹相关状态
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
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
  
  // 添加收藏文件IDs状态
  const [favoritedFileIds, setFavoritedFileIds] = useState<string[]>([]);
  
  // 最近访问文件相关状态
  const [recentFiles, setRecentFiles] = useState<FileInfo[]>([]);
  const [loadingRecentFiles, setLoadingRecentFiles] = useState(false);
  
  // 最近下载文件相关状态
  const [recentDownloads, setRecentDownloads] = useState<FileInfo[]>([]);
  const [loadingRecentDownloads, setLoadingRecentDownloads] = useState(false);
  
  // 添加获取收藏状态的函数
  const fetchFavorites = useCallback(async () => {
    try {
      const response = await fileApi.getFavorites(1, 1000);
      const favoriteFiles = response.items || [];
      setFavoritedFileIds(favoriteFiles.map(file => file.id));
    } catch (error) {
      console.error('获取收藏列表失败:', error);
    }
  }, []);
  
  // 添加刷新函数 - 移到这里与其他hooks一起声明
  const handleRefreshFiles = useCallback(() => {
    // 开始刷新加载状态
    startLoading(true);
    console.log('手动刷新文件列表');
    
    // 刷新收藏列表
    fetchFavorites();
    
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
  }, [currentFolderId, selectedFileType, loadFiles, startLoading, finishLoading, fetchFavorites]);

  // 添加键盘快捷键监听 - 确保所有钩子在组件顶层声明
  useEffect(() => {
    // 快捷键处理函数
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+L: 显示链接输入框
      if (event.ctrlKey && event.key === 'l') {
        event.preventDefault();
        setIsLinkInputVisible(true);
      }
      
      // Esc: 关闭链接输入框
      if (event.key === 'Escape' && isLinkInputVisible) {
        setIsLinkInputVisible(false);
      }
    };
    
    // 添加事件监听器
    window.addEventListener('keydown', handleKeyDown);
    
    // 组件卸载时移除事件监听器
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLinkInputVisible]);

  // 焦点到链接输入框 - 确保所有钩子在组件顶层声明
  useEffect(() => {
    if (isLinkInputVisible && linkInputRef.current) {
      setTimeout(() => {
        linkInputRef.current?.focus();
      }, 100);
    }
  }, [isLinkInputVisible]);

  // 文件上下文菜单处理
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
    setIsCreateFolderModalOpen(true);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      // 清除用户相关的本地存储数据，但保留主题设置
      localStorage.removeItem('user-id');
      
      // 不再清除主题设置，以实现主题持久化
      // const { clearCustomThemes } = await import('@/app/components/ui/themes/theme-service');
      // clearCustomThemes();
      
      // 执行登出操作
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

  // 在页面顶部，添加一个通用的函数来关闭所有特殊视图
  const closeAllSpecialViews = useCallback((newView: string | null = null) => {
    // 重置所有特殊视图的显示状态
    setShowSearchView(false);
    setShowMySharesContent(false);
    setShowFavoritesContent(false);
    setShowRecentFilesContent(false);
    setShowRecentDownloadsContent(false);
    
    // 重置新增的视图控制状态，如果提供了新视图则设置它
    setCurrentView(newView);
    setIsSearchVisible(false);
    setTagSearchOpen(false);
  }, [
    setShowSearchView, 
    setShowMySharesContent, 
    setShowFavoritesContent, 
    setShowRecentFilesContent, 
    setShowRecentDownloadsContent,
    setCurrentView,
    setIsSearchVisible,
    setTagSearchOpen
  ]);

  // Sidebar中"搜索文件"点击处理函数
  const handleSearchClick = (query?: string) => {
    if (query === 'tag') {
      // 标签搜索
      closeAllSpecialViews('tag');
      // 确保搜索视图显示
      setShowSearchView(true);
      setTagSearchOpen(true);
      // 设置搜索类型为标签
      setSearchType('tag');
      // 打开搜索界面并触发搜索
      setTimeout(() => {
        handleSearch("", "tag");
      }, 0);
    } else {
      // 普通搜索，修改为与其他视图一致的实现
      closeAllSpecialViews('search');
      // 确保搜索视图显示
      setShowSearchView(true);
      setIsSearchVisible(true);
      // 设置搜索类型为文件名
      setSearchType('name');
    }
  };

  // 处理文件点击
  const handleFileItemClick = useCallback((file) => {
    // 减少不必要的日志输出
    if (file.isFolder) {
      // 如果是文件夹，使用导航逻辑
      // 关闭所有特殊视图（搜索、收藏、最近访问等）
      closeAllSpecialViews();

      // 使用文件夹导航函数，该函数内部会更新面包屑路径
      handleFileClick(file);
    } else {
      // 如果是文件，查找本地文件并打开预览
      const localFile = files.find(f => f.id === file.id) || file;
      handlePreviewFile(localFile);
    }
  }, [files, handleFileClick, handlePreviewFile, closeAllSpecialViews]);

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
    console.log('处理根目录按钮点击，准备清除过滤器和导航到根目录');
    
    // 先关闭搜索视图
    setShowSearchView(false);
    
    // 清除文件类型过滤
    setSelectedFileType(null);
    
    // 清除当前文件夹ID，导航到根目录
    setCurrentFolderId(null);
    
    // 清除文件夹路径数组
    setFolderPath([]);
    
    // 清除搜索内容和历史记录
    setSearchQuery('');
    clearSearchHistory();
    
    // 开始刷新加载状态
    startLoading(true);
    console.log('开始加载根目录文件');
    
    // 传递null类型参数以确保清除过滤，并强制刷新
    loadFiles(null, null, true)
      .then(() => {
        console.log('根目录文件加载成功');
      })
      .catch(error => {
        console.error('根目录文件加载失败', error);
      })
      .finally(() => {
        console.log('根目录文件加载完成');
        finishLoading();
      });
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
                  // 即使文件加载失败，我们也尝试显示主界面
                  finishLoading(false, '文件列表可能不完整，请稍后刷新');
                  loadInProgressRef.current = false;
                });
            } else {
              console.log('用户资料为空，尝试重新获取...');
              // 增加重试延迟，确保session稳定
              return new Promise(resolve => setTimeout(resolve, 1500))
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
                        // 即使文件加载失败，也尝试显示主界面
                        finishLoading(false, '文件列表可能不完整，请稍后刷新');
                        loadInProgressRef.current = false;
                      });
                  } else {
                    console.error('重试获取用户资料失败');
                    // 尝试使用部分可用的会话信息展示基本界面
                    if (session?.user) {
                      console.log('使用会话信息尝试显示有限功能界面');
                      loadInProgressRef.current = false;
                      // 使用警告消息而不是错误，允许用户继续尝试使用
                      finishLoading(false, '用户资料不完整，部分功能可能受限');
                    } else {
                      loadInProgressRef.current = false;
                      throw new Error("获取用户资料失败，请刷新页面重试");
                    }
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
                        // 即使文件加载失败，也尝试显示主界面
                        finishLoading(false, '文件列表可能不完整，请稍后刷新');
                        loadInProgressRef.current = false;
                      });
                  } else {
                    // 尝试使用会话信息展示有限功能界面
                    if (session?.user?.email) {
                      console.log('使用会话信息显示应急界面');
                      finishLoading(false, '无法获取完整用户资料，部分功能可能不可用');
                    } else {
                      finishLoading(true, '获取用户资料失败，请刷新页面重试');
                    }
                    loadInProgressRef.current = false;
                  }
                })
                .catch(err => {
                  // 如果会话信息可用，尝试显示基础界面
                  if (session?.user?.email) {
                    console.log('使用会话信息显示应急界面');
                    finishLoading(false, '无法获取完整用户资料，部分功能可能不可用');
                  } else {
                    finishLoading(true, err.message || '加载失败，请重试');
                  }
                  loadInProgressRef.current = false;
                });
            }, 2000); // 延长延迟时间
          });
      }, 800); // 延长初始延迟，等待session稳定
    }
  }, [status, session, currentFolderId, selectedFileType, loadFiles, fetchUserProfile, startLoading, finishLoading]);

  // 初始化Lucide图标
  useEffect(() => {
    // @ts-ignore
    window.lucide?.createIcons();
  }, []);
  
  // 计算所有文件是否全部选中
  const areAllFilesSelected = files.length > 0 && selectedFiles.length === files.length;

  // 监听全局事件，从分享页面URL访问的情况
  useEffect(() => {
    // 监听事件
    const handleViewMySharesEvent = () => {
      setShowMySharesContent(true);
    };
    
    window.addEventListener('view-my-shares', handleViewMySharesEvent);
    
    // 清理事件监听器
    return () => {
      window.removeEventListener('view-my-shares', handleViewMySharesEvent);
    };
  }, []);

  // 添加处理收藏和取消收藏的函数
  const handleToggleFavorite = useCallback(async (file: FileInfo, isFavorite: boolean) => {
    try {
      if (isFavorite) {
        // 注意：现在我们使用收藏夹弹窗来选择收藏夹，这里不需要直接调用API
        // 收藏操作由FavoriteModal组件处理，这里只需处理收藏夹弹窗返回的状态
        // (已通过调用setFavoritedFileIds来更新UI状态)
        setFavoritedFileIds(prev => [...prev, file.id]);
        message.success(`已将"${file.name}"添加到收藏`);
      } else {
        // 从收藏中移除
        const response = await fetch('/api/storage/favorites', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fileIds: [file.id] }),
        });
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => '未知错误');
          throw new Error(`服务器错误 (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          message.success(`已将"${file.name}"从收藏中移除`);
          setFavoritedFileIds(prev => prev.filter(id => id !== file.id));
          // 刷新收藏列表
          if (fetchFavorites) {
            fetchFavorites();
          }
        } else {
          throw new Error(data.error || '移除收藏失败');
        }
      }
    } catch (error) {
      console.error('处理收藏操作失败:', error);
      message.error('操作失败，请稍后重试');
    }
  }, [fetchFavorites]);
  
  // 初始加载收藏状态
  useEffect(() => {
    if (session) {
      fetchFavorites();
    }
  }, [session, fetchFavorites]);

  // 获取最近访问的文件
  const fetchRecentFiles = async () => {
    try {
      setLoadingRecentFiles(true);
      const recentFilesData = await fileApi.getRecentFiles(20); // 获取前20个最近访问的文件
      setRecentFiles(recentFilesData);
    } catch (error) {
      console.error('获取最近访问文件失败:', error);
      message.error('获取最近访问文件失败');
    } finally {
      setLoadingRecentFiles(false);
    }
  };
  
  // 获取最近下载的文件
  const fetchRecentDownloads = async () => {
    try {
      setLoadingRecentDownloads(true);
      const recentDownloadsData = await fileApi.getRecentDownloads(20); // 获取前20个最近下载的文件
      setRecentDownloads(recentDownloadsData);
    } catch (error) {
      console.error('获取最近下载文件失败:', error);
      message.error('获取最近下载文件失败');
    } finally {
      setLoadingRecentDownloads(false);
    }
  };

  // 处理最近访问点击
  const handleRecentClick = () => {
    // 关闭其他视图，并设置当前视图为recent
    closeAllSpecialViews('recent');
    setSelectedFileType(null);
    
    // 获取最近访问文件
    fetchRecentFiles();
    
    // 显示最近访问内容
    setShowRecentFilesContent(true);
  };
  
  // 处理最近下载点击
  const handleRecentDownloadsClick = () => {
    // 关闭其他视图，并设置当前视图为downloads
    closeAllSpecialViews('downloads');
    setSelectedFileType(null);
    
    // 获取最近下载文件
    fetchRecentDownloads();
    
    // 显示最近下载内容
    setShowRecentDownloadsContent(true);
  };

  // 处理查看我的分享
  const handleViewMyShares = () => {
    // 关闭其他视图，并设置当前视图为shares
    closeAllSpecialViews('shares');
    setSelectedFileType(null);
    
    // 显示我的分享内容
    setShowMySharesContent(true);
  };

  // 处理收藏夹点击
  const handleFavoritesClick = () => {
    // 关闭其他视图，并设置当前视图为favorites
    closeAllSpecialViews('favorites');
    setSelectedFileType(null);
    
    // 显示收藏内容
    setShowFavoritesContent(true);
  };

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

  // 处理分享按钮点击
  const handleShareButtonClick = () => {
    if (selectedFiles.length === 0) {
      message.warning('请先选择要分享的文件');
      return;
    }
    
    // 打开分享模态窗口
    openShareModal(selectedFiles);
  };

  // 处理链接输入框提交
  const handleLinkSubmit = () => {
    if (!shareLink) {
      message.warning('请输入分享链接');
      return;
    }
    
    // 提取分享码
    const shareCodeMatch = shareLink.match(/\/s\/([a-zA-Z0-9]+)/);
    if (!shareCodeMatch) {
      message.error('无效的分享链接格式');
      return;
    }
    
    const shareCode = shareCodeMatch[1];
    
    // 提取提取码（如果在URL中）
    let extractCode = '';
    const extractCodeMatch = shareLink.match(/code=([a-zA-Z0-9]+)/);
    if (extractCodeMatch) {
      extractCode = extractCodeMatch[1];
    } else {
      extractCode = shareLinkPassword;
    }
    
    if (!extractCode) {
      message.warning('请输入提取码');
      return;
    }
    
    // 关闭输入框
    setIsLinkInputVisible(false);
    
    // 重定向到分享页面
    const url = `/s/${shareCode}?code=${extractCode}`;
    window.open(url, '_blank');
  };

  // 在分享操作成功后处理
  const handleShareSuccess = (result: { shareLink: string, extractCode: string }) => {
    // 关闭分享模态窗口
    closeShareModal();
    
    // 可以在这里添加其他处理，比如显示分享成功提示等
  };

  // 处理创建收藏夹按钮点击
  const handleCreateFavoriteFolder = () => {
    setIsCreateFavoriteModalOpen(true);
  };

  // 处理收藏夹创建成功
  const handleFavoriteCreateSuccess = () => {
    // 递增刷新触发器，强制侧边栏刷新收藏夹列表
    setFavoriteFoldersRefreshTrigger(prev => prev + 1);
  };

  // 在文件管理页面中，添加一个路由判断
  const contentToRender = () => {
    // 公共渲染的面包屑组件
    const renderBreadcrumb = () => (
      <div className={styles.breadcrumbContainer}>
        {console.log('当前渲染面包屑，路径数据:', folderPath)}
        <Breadcrumb
          folderPath={folderPath}
          onPathClick={handleBreadcrumbPathClick}
          onBackClick={handleBreadcrumbBackClick}
          onClearFilter={handleClearFilter}
          key={`breadcrumb-${folderPath.length}-${folderPath.length > 0 ? folderPath[folderPath.length-1].id : 'root'}`}
        />
      </div>
    );

    // 如果当前显示收藏内容，渲染收藏内容组件
    if (showFavoritesContent) {
      return (
        <FavoritesContent
          onNavigateBack={() => setShowFavoritesContent(false)}
          selectedFolderId={selectedFavoriteFolderId}
          titleIcon={<Star size={24} style={{ color: 'var(--theme-primary, #3b82f6)' }} />}
          onOpenFile={(file) => {
            // 关闭所有特殊视图
            closeAllSpecialViews();
            
            // 根据文件类型执行不同的操作
            if (file.isFolder) {
              // 如果是文件夹，导航到该文件夹
              handleFileClick(file);
            } else {
              // 如果是文件，预览该文件
              handlePreviewFile(file);
            }
          }}
        />
      );
    }
    
    // 如果当前显示最近访问内容，渲染最近访问列表
    if (showRecentFilesContent) {
      return (
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '16px 0' 
          }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={24} style={{ color: 'var(--theme-primary, #3b82f6)' }} />
              最近访问的文件
            </h2>
          </div>
          
          {loadingRecentFiles ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin />
              <p>加载最近访问文件...</p>
            </div>
          ) : recentFiles.length > 0 ? (
            <FileList 
              files={recentFiles}
              selectedFiles={selectedFiles}
              onFileClick={(file) => {
                // 根据文件类型执行不同的操作
                if (file.isFolder) {
                  // 如果是文件夹，关闭所有特殊视图并导航到该文件夹
                  closeAllSpecialViews();
                  handleFileClick(file);
                } else {
                  // 如果是文件，预览该文件
                  handlePreviewFile(file);
                }
              }}
              onFileSelect={(file, checked) => onFileCheckboxChange(file as FileInfo, checked)}
              onSelectAll={onSelectAllFiles}
              onDeselectAll={onDeselectAllFiles}
              areAllSelected={false}
              showCheckboxes={true}
              favoritedFileIds={favoritedFileIds}
              onToggleFavorite={handleToggleFavorite}
              fileUpdateTrigger={fileUpdateTrigger}
            />
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 0',
              color: '#888'
            }}>
              <p>暂无最近访问的文件记录</p>
            </div>
          )}
        </div>
      );
    }
    
    // 如果当前显示最近下载内容，渲染最近下载列表
    if (showRecentDownloadsContent) {
      return (
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '16px 0' 
          }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={24} style={{ color: 'var(--theme-primary, #3b82f6)' }} />
              最近下载的文件
            </h2>
          </div>
          
          {loadingRecentDownloads ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin />
              <p>加载最近下载文件...</p>
            </div>
          ) : recentDownloads.length > 0 ? (
            <FileList 
              files={recentDownloads}
              selectedFiles={selectedFiles}
              onFileClick={(file) => {
                // 根据文件类型执行不同的操作
                if (file.isFolder) {
                  // 如果是文件夹，关闭所有特殊视图并导航到该文件夹
                  closeAllSpecialViews();
                  handleFileClick(file);
                } else {
                  // 如果是文件，预览该文件
                  handlePreviewFile(file);
                }
              }}
              onFileSelect={(file, checked) => onFileCheckboxChange(file as FileInfo, checked)}
              onSelectAll={onSelectAllFiles}
              onDeselectAll={onDeselectAllFiles}
              areAllSelected={false}
              showCheckboxes={true}
              favoritedFileIds={favoritedFileIds}
              onToggleFavorite={handleToggleFavorite}
              fileUpdateTrigger={fileUpdateTrigger}
            />
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 0',
              color: '#888'
            }}>
              <p>暂无最近下载的文件记录</p>
            </div>
          )}
        </div>
      );
    }
    
    // 如果当前显示我的分享内容，渲染分享内容组件
    if (showMySharesContent) {
      // 临时确保folderPath为空数组而不是undefined
      if (!folderPath || !Array.isArray(folderPath)) {
        setFolderPath([]);
      }
      return <MySharesContent 
        onNavigateBack={() => {
          // 关闭所有特殊视图，确保完全返回到文件浏览界面
          closeAllSpecialViews();
        }} 
        titleIcon={<Share2 size={24} style={{ color: 'var(--theme-primary, #3b82f6)' }} />}
      />;
    }
    
    // 如果当前显示搜索视图，则渲染搜索组件
    if (showSearchView) {
      return (
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '16px 0' 
          }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {searchType === 'name' ? (
                <Search size={24} style={{ color: 'var(--theme-primary, #3b82f6)' }} />
              ) : (
                <TagIcon size={24} style={{ color: 'var(--theme-primary, #3b82f6)' }} />
              )}
              {searchType === 'name' ? '搜索文件' : '标签搜索'}
            </h2>
            <button
              onClick={() => setShowSearchView(false)}
              style={{
                backgroundColor: 'rgba(247, 250, 252, 0.9)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                color: '#5e6c84',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>
          
          {/* 搜索输入区域 */}
          <div style={{
            marginBottom: '20px',
            backgroundColor: 'rgba(247, 250, 252, 0.5)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid rgba(226, 232, 240, 0.5)',
          }}>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{ 
                display: 'flex',
                flexGrow: 1,
                position: 'relative'
              }}>
                <input
                  type="text"
                  placeholder={searchType === 'name' ? "输入文件名搜索..." : "输入标签搜索..."}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (enableRealTimeSearch && e.target.value.trim()) {
                      handleSearch(e.target.value, searchType);
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(searchQuery, searchType);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 15px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#8c9db5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              
              {/* 搜索类型切换按钮 */}
              <div style={{
                display: 'flex',
                gap: '8px',
              }}>
                <button
                  onClick={() => {
                    setSearchType('name');
                    setCurrentView('search');
                  }}
                  style={{
                    backgroundColor: searchType === 'name' ? 'rgba(52, 144, 220, 0.1)' : 'transparent',
                    color: searchType === 'name' ? '#3490dc' : '#5e6c84',
                    border: '1px solid',
                    borderColor: searchType === 'name' ? '#3490dc' : 'rgba(226, 232, 240, 0.8)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Search size={14} />
                  文件名
                </button>
                <button
                  onClick={() => {
                    setSearchType('tag');
                    setCurrentView('tag');
                    setTagSearchOpen(true);
                  }}
                  style={{
                    backgroundColor: searchType === 'tag' ? 'rgba(52, 144, 220, 0.1)' : 'transparent',
                    color: searchType === 'tag' ? '#3490dc' : '#5e6c84',
                    border: '1px solid',
                    borderColor: searchType === 'tag' ? '#3490dc' : 'rgba(226, 232, 240, 0.8)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <TagIcon size={14} />
                  标签
                </button>
              </div>
            </div>
            
            {enableRealTimeSearch && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: '12px',
                fontSize: '12px',
                color: '#666',
                justifyContent: 'space-between',
              }}>
                <div>
                  <Zap size={14} style={{ marginRight: '6px', color: '#3490dc' }} />
                  实时搜索已启用，输入时自动显示结果
                </div>
              </div>
            )}
          </div>
          
          {/* 搜索结果区域 */}
          {searchLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{
                width: '40px',
                height: '40px',
                margin: '0 auto 20px',
                border: '3px solid rgba(52, 144, 220, 0.2)',
                borderTop: '3px solid #3490dc',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}></div>
              <p>正在搜索，请稍候...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
              }}>
                <div style={{
                  backgroundColor: 'rgba(52, 144, 220, 0.1)',
                  color: '#3490dc',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}>
                  找到 {searchResults.length} 个结果
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  {onSelectAllFiles && onDeselectAllFiles && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={onSelectAllFiles}
                        style={{
                          background: 'none',
                          border: '1px solid rgba(226, 232, 240, 0.8)',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          color: '#5e6c84',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Download size={12} />
                        全选
                      </button>
                      <button
                        onClick={onDeselectAllFiles}
                        style={{
                          background: 'none',
                          border: '1px solid rgba(226, 232, 240, 0.8)',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          color: '#5e6c84',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <X size={12} />
                        取消选择
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <FileList 
                files={searchResults}
                selectedFiles={selectedFiles}
                onFileClick={handleFileItemClick}
                onFileSelect={(file, checked) => onFileCheckboxChange(file as FileInfo, checked)}
                onSelectAll={onSelectAllFiles}
                onDeselectAll={onDeselectAllFiles}
                areAllSelected={false}
                showCheckboxes={true}
                favoritedFileIds={favoritedFileIds}
                onToggleFavorite={handleToggleFavorite}
                fileUpdateTrigger={fileUpdateTrigger}
                onFileContextMenu={handleFileContextMenu}
              />
            </>
          ) : searchQuery && !searchLoading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 0',
              color: '#888',
              backgroundColor: 'rgba(247, 250, 252, 0.5)',
              borderRadius: '12px',
              border: '1px dashed #e2e8f0',
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                lineHeight: '60px',
                fontSize: '24px',
                margin: '0 auto 15px',
                backgroundColor: 'rgba(226, 232, 240, 0.5)',
                borderRadius: '50%',
              }}>
                🔍
              </div>
              <p>未找到相关{searchType === 'name' ? '文件' : '标签'}</p>
              <p style={{ fontSize: '14px', color: '#999', maxWidth: '300px', margin: '10px auto' }}>
                尝试使用不同的关键词{searchType === 'tag' ? '或检查标签拼写' : '或检查文件名拼写'}
              </p>
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 0',
              color: '#888',
              backgroundColor: 'rgba(247, 250, 252, 0.5)',
              borderRadius: '12px',
              border: '1px dashed #e2e8f0',
            }}>
              <p>请输入关键词开始搜索</p>
            </div>
          )}
        </div>
      );
    }
    
    // 否则渲染正常的文件列表
    return (
      <>
        <TopActionBar 
          selectedFiles={files.filter(file => selectedFiles.includes(file.id))}
          onClearSelection={() => setSelectedFiles([])}
          onDownload={() => handleDownload(selectedFiles)}
          onShare={handleShareButtonClick}
          onDelete={() => {
            if (selectedFiles.length === 0) {
              message.warning('请选择要删除的文件');
              return;
            }
            handleDelete(selectedFiles, handleRefreshFiles)
              .then(success => {
                if (success) {
                  message.success('删除成功');
                  setSelectedFiles([]);
                }
              });
          }}
          onCreateFolder={handleCreateFolderClick}
          onMove={handleMoveButtonClick}
          onRename={() => {
            if (selectedFiles.length !== 1) {
              message.warning('请选择一个文件进行重命名');
              return;
            }
            
            const selectedFile = files.find(file => file.id === selectedFiles[0]);
            if (selectedFile) {
              handleRenameButtonClick(selectedFile);
            }
          }}
          onRefresh={handleRefreshFiles}
          onClearFilter={handleClearFilter}
          sortOrder={sortOrder}
          onSortChange={(newSortOrder) => {
            setSortOrder(newSortOrder);
            changeSort(newSortOrder.field, newSortOrder.direction);
          }}
          isRefreshing={isRefreshing}
          onUploadClick={() => setIsUploadModalOpen(true)}
          onFolderUploadClick={() => setIsFolderUploadModalOpen(true)}
          selectedFileType={selectedFileType}
          showSearchView={showSearchView}
          isInRootFolder={currentFolderId === null && folderPath.length === 0 && selectedFileType === null && !showSearchView}
          showUploadDropdown={showUploadDropdown}
          setShowUploadDropdown={setShowUploadDropdown}
          setIsUploadModalOpen={setIsUploadModalOpen}
          setIsFolderUploadModalOpen={setIsFolderUploadModalOpen}
          uploadDropdownRef={uploadDropdownRef}
        />

        {renderBreadcrumb()}

        <div className={styles.fileContainer}>
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
            favoritedFileIds={favoritedFileIds}
            onToggleFavorite={handleToggleFavorite}
            fileUpdateTrigger={fileUpdateTrigger}
          />
        </div>
      </>
    );
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
          onHomeClick={() => {
            // 关闭分享内容视图
            setShowMySharesContent(false);
            
            // 调用原有函数
            handleBreadcrumbPathClick(null);
          }}
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
        {!showThemePanel && (
          <Sidebar
            selectedFileType={selectedFileType}
            onTypeClick={(type) => {
              // 直接将文件类型传给closeAllSpecialViews，一步同时完成关闭特殊视图和更新currentView
              closeAllSpecialViews(type);
              // 然后过滤文件类型
              filterByFileType(type);
            }}
            onSearchClick={handleSearchClick}
            onSharesClick={handleViewMyShares}
            onFavoritesClick={handleFavoritesClick}
            onCreateFavoriteFolder={handleCreateFavoriteFolder}
            onRecentClick={handleRecentClick}
            onRecentDownloadsClick={handleRecentDownloadsClick}
            refreshTrigger={favoriteFoldersRefreshTrigger}
            activeView={searchType === 'tag' ? 'tag' : currentView}
          />
        )}

        {/* 主内容区域 - 根据路由动态变化 */}
        <div className={styles.mainContent}>
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
            contentToRender()
          )}
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

      {/* 分享模态窗口 */}
      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={closeShareModal}
        selectedFiles={files.filter(file => selectedFiles.includes(file.id))}
        onShare={shareFiles}
      />
      
      {/* 链接输入模态窗口 */}
      <Modal
        title="打开分享链接"
        open={isLinkInputVisible}
        onCancel={() => setIsLinkInputVisible(false)}
        onOk={handleLinkSubmit}
        okText="打开"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>分享链接:</div>
          <Input
            ref={linkInputRef}
            value={shareLink}
            onChange={(e) => setShareLink(e.target.value)}
            placeholder="输入分享链接，例如: https://example.com/s/abcdef"
            onPressEnter={handleLinkSubmit}
          />
        </div>
        <div>
          <div style={{ marginBottom: 8 }}>提取码:</div>
          <Input
            value={shareLinkPassword}
            onChange={(e) => setShareLinkPassword(e.target.value)}
            placeholder="输入提取码（如果链接中已包含则无需输入）"
            onPressEnter={handleLinkSubmit}
          />
        </div>
      </Modal>

      {/* 创建收藏夹模态窗口 */}
      <CreateFavoriteModal 
        visible={isCreateFavoriteModalOpen}
        onClose={() => setIsCreateFavoriteModalOpen(false)}
        onSuccess={handleFavoriteCreateSuccess}
      />

      {/* 创建文件夹模态窗口 */}
      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
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
            throw error; // 重新抛出错误，以便在组件中处理
          } finally {
            finishLoading();
          }
        }}
      />

      {/* 添加加载动画的keyframes */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
       