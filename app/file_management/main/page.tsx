// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { message, Dropdown, Button, Spin } from 'antd';
import Link from 'next/link';
import { 
  Home, LogOut, Folder, ChevronDown, ChevronRight, Files, 
  Image as ImageIcon, FileText, Video, Music, File, X, 
  Download, Edit, Move, Trash2, Search, Upload, FolderUp, Plus,
  SortAsc,
  SortDesc,
  Filter
} from 'lucide-react';
import type { MenuProps } from 'antd';
import Head from 'next/head';

// 引入共享组件
import { 
  Sidebar, 
  Breadcrumb, 
  FileList, 
  UploadModal, 
  UploadButton,
  SkeletonPageLayout,
  ErrorDisplay
} from '../components/shared';
import { FileItemType } from '../components/shared/FileList';
import FilePreview from '../components/FilePreview';
import RenameModal from './components/RenameModal';

// 导入自定义 hooks
import { useFiles } from './hooks/useFiles';
import { useFileActions } from './hooks/useFileActions';
import { useSearch } from './hooks/useSearch';
import { useUserProfile } from './hooks/useUserProfile';
import { useLoadingState } from '../hooks/useLoadingState';

// 导入类型和工具函数
import { File as FileType, FileType as FileTypeEnum, SortOrder } from '../types/index';
import { getFileIcon, formatFileSize, formatDate, getFileType } from '../utils/fileHelpers';

// 导入组件
import { SearchView } from './components/SearchView';

// 导入样式
import styles from '../styles/shared.module.css';

// 导入主题服务
import { 
  applyTheme as applyThemeService, 
  loadThemeFromStorage, 
  addThemeChangeListener 
} from '@/app/shared/themes';

// 本地FileType定义，确保与useFileActions中使用的一致
interface LocalFileType {
  id: string;
  name: string;
  type: string; // 确保type不是可选的
  extension?: string;
  size?: number;
  isFolder?: boolean;
  createdAt?: string | Date;
  tags?: string[];
  parentId?: string | null;
  path?: string;
  updatedAt: string; // 确保updatedAt不是可选的
}

// 改进类型转换函数
function convertToFileItemType(file: LocalFileType): FileItemType {
  return {
    id: file.id,
    name: file.name,
    type: file.type,
    extension: file.extension,
    size: file.size,
    isFolder: file.isFolder,
    createdAt: typeof file.createdAt === 'string' ? file.createdAt : file.createdAt?.toString(),
    tags: file.tags
  };
}

// 将FileItemType转换为FileType的工具函数
const adaptLocalFileToFileItemType = (file: LocalFileType): FileItemType => ({
  id: file.id,
  name: file.name,
  type: file.type,
  extension: file.extension,
  size: file.size,
  isFolder: file.isFolder,
  createdAt: typeof file.createdAt === 'string' ? file.createdAt : file.createdAt?.toString(),
  tags: file.tags
});

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
    effectiveAvatarUrl,
    applyTheme
  } = useUserProfile();

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
  
  // 引用 hooks
  const { 
    files, isLoading: filesLoading, error: filesError, currentFolderId, setCurrentFolderId, 
    folderPath, setFolderPath, selectedFileType, setSelectedFileType,
    sortOrder, setSortOrder, loadFiles, handleFileClick, handleBackClick, handleSort
  } = useFiles();

  // 文件操作钩子
  const {
    selectedFiles, setSelectedFiles, editingFile, setEditingFile,
    editingName, setEditingName, editingTags, setEditingTags,
    isCreatingFolder, setIsCreatingFolder, newFolderName, setNewFolderName,
    newFolderTags, setNewFolderTags, handleDownload, handleDelete,
    handleStartEdit, handleConfirmEdit, handleCreateFolder, handleSelectFile,
    handleAddTag, handleRemoveTag
  } = useFileActions(() => loadFiles(currentFolderId, selectedFileType));

  // 搜索钩子
  const {
    showSearchView, setShowSearchView, searchQuery, setSearchQuery,
    searchResults, searchType, setSearchType,
    searchLoading, searchError, handleSearch
  } = useSearch();

  // 合并相关UI状态
  const [uiState, setUiState] = useState({
    sidebarVisible: true,
    myFilesExpanded: true,
    quickAccessExpanded: true,
    showSortDropdown: false,
  });

  // 更新UI状态的工具函数
  const updateUiState = useCallback((key, value) => {
    setUiState(prev => ({...prev, [key]: value}));
  }, []);

  // 合并上传相关状态
  const [uploadState, setUploadState] = useState({
    isModalOpen: false,
    isFolderModalOpen: false,
    showDropdown: false,
    isDropdownOpen: false,
  });

  // 更新上传状态的工具函数
  const updateUploadState = useCallback((key, value) => {
    setUploadState(prev => ({...prev, [key]: value}));
  }, []);

  // 其他独立状态
  const [newTag, setNewTag] = useState('');
  const [selectedFile, setSelectedFile] = useState<LocalFileType | null>(null);
  const [previewFile, setPreviewFile] = useState<LocalFileType | null>(null);
  
  // RenameModal状态 - 移动到这里，确保在所有条件返回之前定义
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState<LocalFileType | null>(null);
  
  // 引用
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const newFolderInputRef = useRef<HTMLInputElement>(null);
  const uploadDropdownRef = useRef<HTMLDivElement>(null);
  
  // 状态跟踪引用
  const hasLoadedFilesRef = useRef(false);
  const sessionInitializedRef = useRef(false);

  // 使用解构简化状态引用
  const { 
    sidebarVisible, myFilesExpanded, quickAccessExpanded, showSortDropdown 
  } = uiState;
  
  const {
    isModalOpen: isUploadModalOpen,
    isFolderModalOpen: isFolderUploadModalOpen,
    showDropdown: showUploadDropdown,
    isDropdownOpen: isUploadDropdownOpen
  } = uploadState;

  // 简化状态更新函数
  const setSidebarVisible = useCallback((visible) => 
    updateUiState('sidebarVisible', visible), [updateUiState]);
    
  const setMyFilesExpanded = useCallback((expanded) => 
    updateUiState('myFilesExpanded', expanded), [updateUiState]);
    
  const setQuickAccessExpanded = useCallback((expanded) => 
    updateUiState('quickAccessExpanded', expanded), [updateUiState]);
    
  const setShowSortDropdown = useCallback((visible) => 
    updateUiState('showSortDropdown', visible), [updateUiState]);

  // 上传状态更新函数
  const setIsUploadModalOpen = useCallback((open) => 
    updateUploadState('isModalOpen', open), [updateUploadState]);
    
  const setIsFolderUploadModalOpen = useCallback((open) => 
    updateUploadState('isFolderModalOpen', open), [updateUploadState]);
    
  const setShowUploadDropdown = useCallback((show) => 
    updateUploadState('showDropdown', show), [updateUploadState]);
    
  const setIsUploadDropdownOpen = useCallback((open) => 
    updateUploadState('isDropdownOpen', open), [updateUploadState]);

  // 处理文件操作的回调函数
  const handleFileContextMenu = useCallback((event: React.MouseEvent, file: LocalFileType) => {
    event.preventDefault();
    setSelectedFile(file);
    setSelectedFiles([file.id]);
  }, [setSelectedFiles]);

  const onSelectAllFiles = useCallback(() => {
    setSelectedFiles(files.map(file => file.id));
  }, [files, setSelectedFiles]);

  const onDeselectAllFiles = useCallback(() => {
    setSelectedFiles([]);
  }, [setSelectedFiles]);

  const onFileCheckboxChange = useCallback((file: LocalFileType, checked: boolean) => {
    handleSelectFile(file.id, checked);
  }, [handleSelectFile]);

  // 在文件上传或文件夹上传成功后触发的函数
  const handleUploadSuccess = useCallback(() => {
    // 开始刷新加载状态
    startLoading(true);
    
    // 刷新文件列表，保持当前文件类型过滤
    loadFiles(currentFolderId, selectedFileType).finally(() => {
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

  const handleFileDoubleClick = useCallback((file: LocalFileType) => {
    // 确保与handleFileClick的行为一致
    if (file.isFolder) {
      // 如果是文件夹，进入该文件夹
      console.log(`双击文件夹: ID=${file.id}, 名称=${file.name}`);
      setCurrentFolderId(file.id);
      loadFiles(file.id, selectedFileType);
      setFolderPath(prev => [...prev, { id: file.id, name: file.name }]);
    } else {
      // 如果是普通文件，下载文件而不是导航到预览页面
      console.log(`双击文件: ${file.name}，开始下载`);
      handleDownload(file);
    }
  }, [router, loadFiles, selectedFileType, setCurrentFolderId, setFolderPath, handleDownload]);

  // Sidebar中"搜索文件"点击处理函数
  const handleSearchClick = useCallback(() => {
    setShowSearchView(true);
  }, [setShowSearchView]);

  // 处理文件重命名
  const handleOpenRenameModal = useCallback((file: LocalFileType) => {
    setFileToRename(file);
    setIsRenameModalOpen(true);
  }, []);
  
  const handleRenameFile = useCallback(async (newName: string, tags?: string[]) => {
    if (!fileToRename) return;
    
    try {
      const response = await fetch('/api/files/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: fileToRename.id, 
          newName,
          tags: tags || fileToRename.tags
        }),
      });
      
      if (!response.ok) {
        throw new Error('重命名失败');
      }
      
      await response.json();
      message.success('重命名成功');
      
      // 刷新文件列表
      loadFiles(currentFolderId, selectedFileType);
    } catch (error) {
      console.error('重命名错误:', error);
      message.error('重命名失败，请重试');
    } finally {
      setFileToRename(null);
      setIsRenameModalOpen(false);
    }
  }, [fileToRename, currentFolderId, selectedFileType, loadFiles]);
  
  // 修改重命名按钮点击处理函数
  const handleRenameButtonClick = useCallback(() => {
    if (selectedFiles.length !== 1) {
      message.warning('请选择一个文件进行重命名');
      return;
    }
    const selectedFile = files.find(file => file.id === selectedFiles[0]);
    if (selectedFile) {
      handleOpenRenameModal(selectedFile);
    }
  }, [selectedFiles, files, handleOpenRenameModal]);

  // 处理文件点击
  const handleFileItemClick = useCallback((file: FileItemType) => {
    const localFile = files.find(f => f.id === file.id);
    if (!localFile) return;

    if (localFile.isFolder) {
      // 如果是文件夹，继续使用原有的导航逻辑
      handleFileClick(localFile);
    } else {
      // 如果是文件，打开预览
      setPreviewFile(localFile);
    }
  }, [files, handleFileClick]);

  // 关闭预览
  const handleClosePreview = useCallback(() => {
    setPreviewFile(null);
  }, []);

  // 应用用户主题
  useEffect(() => {
    // 应用主题优先级：
    // 1. userProfile中的主题
    // 2. localStorage中的主题
    // 3. 默认主题
    if (userProfile && userProfile.theme) {
      console.log('从用户资料应用主题:', userProfile.theme);
      applyThemeService(userProfile.theme);
    } else {
      const cachedTheme = loadThemeFromStorage();
      if (cachedTheme) {
        console.log('从localStorage恢复主题:', cachedTheme);
        applyThemeService(cachedTheme);
      } else {
        console.log('应用默认主题');
        applyThemeService('default');
      }
    }
    
    // 添加主题变更事件监听
    const removeListener = addThemeChangeListener((themeId, themeStyle) => {
      console.log('接收到主题变更事件，应用新主题:', themeId);
      applyThemeService(themeId);
    });
    
    // 组件卸载时移除事件监听
    return () => {
      removeListener();
    };
  }, [userProfile]);

  // 重定向逻辑优化 - 添加router到依赖
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

  // 文件加载逻辑优化 - 使用双状态管理并改进加载顺序
  useEffect(() => {
    // 确保session存在且状态为已认证，且文件未加载过
    if (status === 'authenticated' && !hasLoadedFilesRef.current) {
      console.log('初始加载文件列表', { currentFolderId, selectedFileType });
      
      // 标记已经开始加载
      hasLoadedFilesRef.current = true;
      
      // 开始加载，这是初始加载，使用骨架屏
      startLoading(false);
      
      // 修改为先加载用户资料，成功后再加载文件列表
      fetchUserProfile()
        .then(userProfileData => {
          if (userProfileData) {
            console.log('用户资料加载成功，继续加载文件列表');
            // 只有在用户资料加载成功后才加载文件列表
            return loadFiles(currentFolderId, selectedFileType)
              .then(() => {
                console.log('文件列表加载成功，完成初始化加载');
                finishLoading(false);
              });
          } else {
            console.log('用户资料为空，尝试重新获取...');
            return fetchUserProfile(true) // 强制刷新模式
              .then(retryProfileData => {
                if (retryProfileData) {
                  console.log('重试获取用户资料成功，继续加载文件列表');
                  return loadFiles(currentFolderId, selectedFileType)
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
          finishLoading(true, error.message || '加载失败，请重试');
        });
    }
  }, [status, currentFolderId, selectedFileType, loadFiles, fetchUserProfile, startLoading, finishLoading]);

  // 点击外部关闭下拉菜单 - 添加依赖项
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUploadDropdown(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
      if (uploadDropdownRef.current && !uploadDropdownRef.current.contains(event.target as Node)) {
        // 关闭上传下拉菜单
        setShowUploadDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowUploadDropdown, setShowSortDropdown]);  // 添加状态设置函数作为依赖

  // 监听排序条件变化 - 简化
  useEffect(() => {
    console.log('排序条件变化:', sortOrder);
    // 不再需要在这里重新加载文件列表，因为useFiles中已经处理了排序
    // 文件列表的排序现在完全由useFiles内部处理
  }, [sortOrder]);

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
              return loadFiles(currentFolderId, selectedFileType);
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
        <div className={styles.miniSidebar}>
          <div className={styles.patternOverlay}></div>
          <div className={styles.avatarContainer}>
            <button 
              className={styles.miniSidebarButton}
              onClick={() => {
                router.push('/dashboard');
              }}
            >
              {effectiveAvatarUrl ? (
                <Image
                  src={`${effectiveAvatarUrl}?t=${Date.now()}`}
                  alt="用户头像"
                  width={38}
                  height={38}
                  className="rounded-full ring-1 ring-white/50 transition-all duration-300 hover:ring-2"
                />
              ) : (
                <div 
                  className={styles.avatarPlaceholder}
                  style={{ width: '38px', height: '38px', fontSize: '16px' }}
                >
                  {userProfile?.name?.[0]?.toUpperCase() || userProfile?.email?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </button>
          </div>
          <div className={styles.miniSidebarDivider}></div>
          <button 
            className={styles.miniSidebarButton}
            onClick={() => {
              setCurrentFolderId(null);
              setFolderPath([]);
              
              // 开始刷新加载状态
              startLoading(true);
              
              // 保持当前选中的文件类型
              loadFiles(null, selectedFileType)
                .finally(() => finishLoading());
            }}
          >
            <Home className="w-5 h-5 text-white" />
          </button>
          <button 
            className={styles.miniSidebarButton}
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 text-white" />
          </button>
        </div>

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
          
          {/* 导航栏和面包屑固定在顶部 */}
          <div className={styles.topBar}>
            <div className={styles.buttonGroup}>
              {selectedFiles.length > 0 ? (
                <>
                  <button className={styles.topButton} onClick={() => setSelectedFiles([])}>
                    <X className="w-4 h-4" />
                    取消选择
                  </button>
                  <button className={styles.topButton} onClick={() => handleDownload()}>
                    <Download className="w-4 h-4" />
                    下载
                  </button>
                  <button 
                    className={styles.topButton}
                    onClick={handleRenameButtonClick}
                  >
                    <Edit className="w-4 h-4" />
                    重命名
                  </button>
                  <button className={styles.topButton}>
                    <Move className="w-4 h-4" />
                    移动
                  </button>
                  <button className={styles.topButton} onClick={handleDelete}>
                    <Trash2 className="w-4 h-4" />
                    删除
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className={styles.topButton}
                    onClick={() => {
                      setShowSearchView(false);
                      setSelectedFileType(null);
                      setCurrentFolderId(null);
                      setFolderPath([]);
                      
                      // 开始刷新加载状态
                      startLoading(true);
                      
                      // 传递null类型参数以确保清除过滤
                      loadFiles(null, null)
                        .finally(() => finishLoading());
                    }}
                    disabled={!currentFolderId && !selectedFileType && !showSearchView}
                  >
                    <span>📁</span>
                    {showSearchView ? '返回文件列表' : (selectedFileType ? '清除过滤' : '根目录')}
                  </button>

                  {/* 添加当前过滤状态指示器 */}
                  {selectedFileType && (
                    <div className={styles.topButton} style={{ cursor: 'default', background: '#f0f7ff', borderColor: '#60a5fa' }}>
                      {(() => {
                        switch(selectedFileType) {
                          case 'image': return <ImageIcon className="w-4 h-4 mr-2" />;
                          case 'document': return <FileText className="w-4 h-4 mr-2" />;
                          case 'video': return <Video className="w-4 h-4 mr-2" />;
                          case 'audio': return <Music className="w-4 h-4 mr-2" />;
                          case 'other': return <File className="w-4 h-4 mr-2" />;
                          default: return null;
                        }
                      })()}
                      当前浏览：
                      {selectedFileType === 'image' && '仅图片'}
                      {selectedFileType === 'document' && '仅文档'}
                      {selectedFileType === 'video' && '仅视频'}
                      {selectedFileType === 'audio' && '仅音频'}
                      {selectedFileType === 'other' && '其他文件'}
                    </div>
                  )}

                  {/* 排序下拉菜单 */}
                  <div className={styles.sortDropdown} ref={sortDropdownRef}>
                    <button 
                      className={styles.topButton}
                      onClick={() => setShowSortDropdown(!showSortDropdown)}
                      style={{ 
                        background: showSortDropdown ? '#f0f7ff' : 'white',
                        borderColor: showSortDropdown ? '#60a5fa' : '#e8e8e8'
                      }}
                    >
                      <span>↕️</span>
                      排序: {(() => {
                        switch(sortOrder.field) {
                          case 'name': return '文件名';
                          case 'size': return '大小';
                          case 'createdAt': return '时间';
                          default: return '默认';
                        }
                      })()} {sortOrder.direction === 'asc' ? '↑' : '↓'}
                    </button>
                    {showSortDropdown && (
                      <div className={styles.dropdownMenu}>
                        <button 
                          className={styles.dropdownItem}
                          onClick={() => {
                            const newSortOrder: SortOrder = {
                              field: 'name',
                              direction: sortOrder.field === 'name' && sortOrder.direction === 'asc' ? 'desc' : 'asc'
                            };
                            setSortOrder(newSortOrder);
                            setShowSortDropdown(false);
                          }}
                          style={{ 
                            fontWeight: sortOrder.field === 'name' ? 'bold' : 'normal',
                            background: sortOrder.field === 'name' ? '#f0f7ff' : 'transparent'
                          }}
                        >
                          <span>📝</span>
                          按文件名{sortOrder.field === 'name' ? (sortOrder.direction === 'asc' ? ' ↑' : ' ↓') : ''}
                        </button>
                        <button 
                          className={styles.dropdownItem}
                          onClick={() => {
                            const newSortOrder: SortOrder = {
                              field: 'size',
                              direction: sortOrder.field === 'size' && sortOrder.direction === 'asc' ? 'desc' : 'asc'
                            };
                            setSortOrder(newSortOrder);
                            setShowSortDropdown(false);
                          }}
                          style={{ 
                            fontWeight: sortOrder.field === 'size' ? 'bold' : 'normal',
                            background: sortOrder.field === 'size' ? '#f0f7ff' : 'transparent'
                          }}
                        >
                          <span>📊</span>
                          按大小{sortOrder.field === 'size' ? (sortOrder.direction === 'asc' ? ' ↑' : ' ↓') : ''}
                        </button>
                        <button 
                          className={styles.dropdownItem}
                          onClick={() => {
                            const newSortOrder: SortOrder = {
                              field: 'createdAt',
                              direction: sortOrder.field === 'createdAt' && sortOrder.direction === 'asc' ? 'desc' : 'asc'
                            };
                            setSortOrder(newSortOrder);
                            setShowSortDropdown(false);
                          }}
                          style={{ 
                            fontWeight: sortOrder.field === 'createdAt' ? 'bold' : 'normal',
                            background: sortOrder.field === 'createdAt' ? '#f0f7ff' : 'transparent'
                          }}
                        >
                          <span>🕒</span>
                          按时间{sortOrder.field === 'createdAt' ? (sortOrder.direction === 'asc' ? ' ↑' : ' ↓') : ''}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* 将上传按钮和新建文件夹按钮移到这里 */}
                  <UploadButton 
                    showDropdown={showUploadDropdown}
                    setShowDropdown={setShowUploadDropdown}
                    setIsModalOpen={setIsUploadModalOpen}
                    setIsFolderModalOpen={setIsFolderUploadModalOpen}
                    uploadDropdownRef={uploadDropdownRef}
                  />
                  
                  <button 
                    className={styles.folderButton} 
                    onClick={handleCreateFolderClick}
                  >
                    <FolderUp className="w-4 h-4 mr-2" />
                    新建文件夹
                  </button>
                </>
              )}
            </div>
          </div>
          
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
              <SearchView 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchResults={searchResults}
                searchType={searchType}
                setSearchType={setSearchType}
                searchLoading={searchLoading}
                searchError={searchError}
                handleSearch={handleSearch}
                handleFileClick={(file) => {
                  // 如果是文件夹，则导航到该文件夹
                  if (file.isFolder) {
                    setShowSearchView(false);
                    setCurrentFolderId(file.id);
                    if (file.path) {
                      // 解析路径生成面包屑导航
                      const segments = file.path.split('/').filter(Boolean);
                      const newPath = segments.map((name, index) => ({
                        id: file.id, // 暂时使用当前文件夹ID
                        name
                      }));
                      setFolderPath(newPath);
                    } else {
                      setFolderPath([{ id: file.id, name: file.name }]);
                    }
                    loadFiles(file.id);
                  } else {
                    // 如果是文件，打开预览
                    setPreviewFile(file as LocalFileType);
                  }
                }}
              />
            ) : (
              // 文件列表
              <>
                {isCreatingFolder && (
                  <div className={`${styles.newFolderRow} p-4 border border-gray-200 rounded-lg bg-white shadow-sm mb-4`}>
                    <div className={`${styles.newFolderForm} flex flex-col space-y-4`}>
                      <div className={`flex items-center`}>
                        <Folder className="w-6 h-6 text-blue-500 flex-shrink-0 mr-3" />
                        <div className={`${styles.newFolderNameContainer} flex-grow`}>
                          <input
                            type="text"
                            ref={newFolderInputRef}
                            className={`${styles.newFolderInput} h-10 px-3 rounded-md border border-gray-300 w-full text-base`}
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="新文件夹名称"
                            autoFocus
                          />
                        </div>
                      </div>
                      
                      <div className={`${styles.newFolderTagsContainer} ml-9`}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">添加标签</label>
                        <div className={`${styles.tagsWrapper} h-10 flex items-center flex-wrap gap-2 border border-gray-300 rounded-md px-3 py-1 overflow-y-auto`}>
                          {newFolderTags.map((tag, index) => (
                            <div key={index} className={`${styles.tagItem} h-7 flex items-center bg-blue-100 text-blue-800 px-2 rounded-md`}>
                              <span className="text-sm">{tag}</span>
                              <button
                                className={`${styles.removeTagButton} ml-1 text-blue-600 hover:text-blue-800 w-5 h-5 flex items-center justify-center rounded-full hover:bg-blue-200`}
                                onClick={() => {
                                  const updatedTags = [...newFolderTags];
                                  updatedTags.splice(index, 1);
                                  setNewFolderTags(updatedTags);
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <input
                            type="text"
                            className={`${styles.tagInput} flex-grow h-7 border-0 outline-none text-sm bg-transparent`}
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newTag.trim()) {
                                setNewFolderTags([...newFolderTags, newTag.trim()]);
                                setNewTag('');
                                e.preventDefault();
                              }
                            }}
                            placeholder="添加标签..."
                          />
                        </div>
                      </div>
                      
                      <div className={`${styles.newFolderActions} flex items-center gap-3 ml-9`}>
                        <button 
                          className={`${styles.confirmButton} h-10 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center justify-center`}
                          onClick={() => {
                            handleCreateFolder(currentFolderId);
                          }}
                        >
                          创建
                        </button>
                        <button 
                          className={`${styles.cancelButton} h-10 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md flex items-center justify-center border border-gray-300`}
                          onClick={() => {
                            setIsCreatingFolder(false);
                            setNewFolderName('');
                            setNewFolderTags([]);
                            setNewTag('');
                          }}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 文件列表组件 */}
                <FileList 
                  files={files.map(adaptLocalFileToFileItemType)}
                  onFileClick={handleFileItemClick}
                  onFileSelect={(file, checked) => onFileCheckboxChange(file as LocalFileType, checked)}
                  onSelectAll={onSelectAllFiles}
                  onDeselectAll={onDeselectAllFiles}
                  selectedFiles={selectedFiles}
                  onFileContextMenu={(e, file) => handleFileContextMenu(e, file as LocalFileType)}
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
       