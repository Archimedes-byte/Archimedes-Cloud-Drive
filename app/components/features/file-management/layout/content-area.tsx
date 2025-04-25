import React from 'react';
import { Breadcrumb, message, Badge } from 'antd';
import { 
  ChevronRight, 
  FolderClosed, 
  Home,
  FileText,
  FileType
} from 'lucide-react';

import { AntFileList } from '../file-list';
import { SearchContainer } from '../search-view/search-container';
import { RecentFilesContent } from '../recent-files';
import { RecentDownloadsContent } from '../recent-downloads';
import { TopActionBar } from '../action-bar/top-action-bar';
import { FavoritesContent } from '../favorites';
import { SharesContent } from '../shares';

import { Breadcrumb as FileBreadcrumb } from '../navigation/breadcrumb';

import styles from '../styles/layout/page-layout.module.css';

import { FileInfo } from '@/app/types';
import { FileTypeEnum, SortDirectionEnum, FileSortInterface, SortField } from '@/app/types/domains/fileTypes';

interface ContentAreaProps {
  // 视图状态
  showFavoritesContent: boolean;
  showRecentFilesContent: boolean;
  showRecentDownloadsContent: boolean;
  showMySharesContent: boolean;
  showSearchView: boolean;
  
  // 文件数据
  files: FileInfo[];
  selectedFiles: string[];
  isRefreshing: boolean;
  filesLoading: boolean;
  filesError: string | null;
  favoritedFileIds: string[];
  fileUpdateTrigger: number;
  
  // 面包屑相关
  folderPath: any[];
  currentFolderId: string | null;
  selectedFileType: FileTypeEnum | null;
  
  // 搜索相关
  searchQuery: string;
  searchType: string;
  searchResults: FileInfo[];
  searchLoading: boolean;
  enableRealTimeSearch: boolean;
  
  // 最近文件和下载
  recentFiles: FileInfo[];
  loadingRecentFiles: boolean;
  recentDownloads: FileInfo[];
  loadingRecentDownloads: boolean;
  
  // 排序相关
  sortOrder: FileSortInterface;
  
  // 收藏夹
  selectedFavoriteFolderId?: string;
  
  // 模态窗口状态
  showUploadDropdown: boolean;
  uploadDropdownRef: React.RefObject<HTMLDivElement>;
  
  // 事件处理函数
  onBreadcrumbPathClick: (folderId: string | null) => void;
  onBreadcrumbBackClick: () => void;
  onClearFilter: () => void;
  closeAllSpecialViews: () => void;
  onFileClick: (file: FileInfo) => void;
  onPreviewFile: (file: FileInfo) => void;
  onFileItemClick: (file: FileInfo) => void;
  onFileCheckboxChange: (file: FileInfo, checked: boolean) => void;
  onSelectAllFiles: () => void;
  onDeselectAllFiles: () => void;
  onToggleFavorite: (file: FileInfo, isFavorite: boolean) => void;
  onFileContextMenu: (event: React.MouseEvent, file: FileInfo) => void;
  onDownload: (fileIds: string[]) => void;
  onShare: () => void;
  onDelete: (fileIds: string[], callback: () => void) => Promise<boolean>;
  onRefreshFiles: () => void;
  onCreateFolder: () => void;
  onRename: (file: FileInfo) => void;
  onMove: () => void;
  onSearch: (query: string, type: string) => void;
  onSearchChange: (query: string) => void;
  onRealTimeSearchChange: (enable: boolean) => void;
  
  // 模态窗口操作
  setShowUploadDropdown: (show: boolean) => void;
  setIsUploadModalOpen: (isOpen: boolean) => void;
  setIsFolderUploadModalOpen: (isOpen: boolean) => void;
  changeSort: (field: SortField, direction: SortDirectionEnum) => void;
  setSortOrder: (sortOrder: FileSortInterface) => void;
}

export const ContentArea: React.FC<ContentAreaProps> = ({
  // 视图状态
  showFavoritesContent,
  showRecentFilesContent,
  showRecentDownloadsContent,
  showMySharesContent,
  showSearchView,
  
  // 文件数据
  files,
  selectedFiles,
  isRefreshing,
  filesLoading,
  filesError,
  favoritedFileIds,
  fileUpdateTrigger,
  
  // 面包屑相关
  folderPath,
  currentFolderId,
  selectedFileType,
  
  // 搜索相关
  searchQuery,
  searchType,
  searchResults,
  searchLoading,
  enableRealTimeSearch,
  
  // 最近文件和下载
  recentFiles,
  loadingRecentFiles,
  recentDownloads,
  loadingRecentDownloads,
  
  // 排序相关
  sortOrder,
  
  // 收藏夹
  selectedFavoriteFolderId,
  
  // 模态窗口状态
  showUploadDropdown,
  uploadDropdownRef,
  
  // 事件处理函数
  onBreadcrumbPathClick,
  onBreadcrumbBackClick,
  onClearFilter,
  closeAllSpecialViews,
  onFileClick,
  onPreviewFile,
  onFileItemClick,
  onFileCheckboxChange,
  onSelectAllFiles,
  onDeselectAllFiles,
  onToggleFavorite,
  onFileContextMenu,
  onDownload,
  onShare,
  onDelete,
  onRefreshFiles,
  onCreateFolder,
  onRename,
  onMove,
  onSearch,
  onSearchChange,
  onRealTimeSearchChange,
  
  // 模态窗口操作
  setShowUploadDropdown,
  setIsUploadModalOpen,
  setIsFolderUploadModalOpen,
  changeSort,
  setSortOrder,
}) => {
  // 面包屑渲染
  const renderBreadcrumb = () => {
    return (
      <div className={styles.breadcrumbContainer}>
        <FileBreadcrumb 
          folderPath={folderPath}
          showHome={true}
          onPathClick={onBreadcrumbPathClick}
          onBackClick={onBreadcrumbBackClick}
          onClearFilter={onClearFilter}
          selectedFileType={selectedFileType}
        />
      </div>
    );
  };

  // 如果当前显示收藏内容，渲染收藏内容组件
  if (showFavoritesContent) {
    return (
      <FavoritesContent
        onNavigateBack={() => closeAllSpecialViews()}
        selectedFolderId={selectedFavoriteFolderId}
        titleIcon={null}
        onOpenFile={(file) => {
          closeAllSpecialViews();
          
          if (file.isFolder) {
            onFileClick(file);
          } else {
            onPreviewFile(file);
          }
        }}
      />
    );
  }
  
  // 如果当前显示最近访问内容，渲染最近访问列表
  if (showRecentFilesContent) {
    return (
      <RecentFilesContent
        loadingRecentFiles={loadingRecentFiles}
        recentFiles={recentFiles}
        selectedFiles={selectedFiles}
        favoritedFileIds={favoritedFileIds}
        fileUpdateTrigger={fileUpdateTrigger}
        onFileClick={onFileItemClick}
        onFileSelect={onFileCheckboxChange}
        onSelectAll={onSelectAllFiles}
        onDeselectAll={onDeselectAllFiles}
        onToggleFavorite={onToggleFavorite}
      />
    );
  }
  
  // 如果当前显示最近下载内容，渲染最近下载列表
  if (showRecentDownloadsContent) {
    return (
      <RecentDownloadsContent
        loadingRecentDownloads={loadingRecentDownloads}
        recentDownloads={recentDownloads}
        selectedFiles={selectedFiles}
        favoritedFileIds={favoritedFileIds}
        fileUpdateTrigger={fileUpdateTrigger}
        onFileClick={onFileItemClick}
        onFileSelect={onFileCheckboxChange}
        onSelectAll={onSelectAllFiles}
        onDeselectAll={onDeselectAllFiles}
        onToggleFavorite={onToggleFavorite}
      />
    );
  }
  
  // 如果当前显示我的分享内容，渲染分享内容组件
  if (showMySharesContent) {
    return (
      <SharesContent 
        onNavigateBack={() => {
          // 关闭所有特殊视图，确保完全返回到文件浏览界面
          closeAllSpecialViews();
        }} 
        titleIcon={null}
      />
    );
  }
  
  // 如果当前显示搜索视图，则渲染搜索组件
  if (showSearchView) {
    return (
      <SearchContainer 
        searchQuery={searchQuery}
        searchType={searchType}
        searchResults={searchResults}
        searchLoading={searchLoading}
        selectedFiles={selectedFiles}
        favoritedFileIds={favoritedFileIds}
        fileUpdateTrigger={fileUpdateTrigger}
        enableRealTimeSearch={enableRealTimeSearch}
        onSearchChange={onSearchChange}
        onSearch={() => onSearch(searchQuery, searchType)}
        onSearchClear={() => onSearchChange('')}
        onSearchClose={() => closeAllSpecialViews()}
        onRealTimeSearchChange={onRealTimeSearchChange}
        onFileClick={onFileItemClick}
        onFileSelect={onFileCheckboxChange}
        onSelectAll={onSelectAllFiles}
        onDeselectAll={onDeselectAllFiles}
        onToggleFavorite={onToggleFavorite}
        onFileContextMenu={onFileContextMenu}
      />
    );
  }
  
  // 否则渲染标准文件列表组件
  return (
    <div className={styles.fileAreaContainer}>
      <TopActionBar 
        selectedFiles={files.filter(file => selectedFiles.includes(file.id))}
        onClearSelection={() => onDeselectAllFiles()}
        onDownload={() => onDownload(selectedFiles)}
        onShare={onShare}
        onDelete={() => {
          if (selectedFiles.length === 0) {
            message.warning('请选择要删除的文件');
            return;
          }
          onDelete(selectedFiles, onRefreshFiles)
            .then(success => {
              if (success) {
                message.success('删除成功');
                onDeselectAllFiles();
              }
            });
        }}
        onCreateFolder={onCreateFolder}
        onMove={onMove}
        onRename={() => {
          if (selectedFiles.length !== 1) {
            message.warning('请选择一个文件进行重命名');
            return;
          }
          
          const selectedFile = files.find(file => file.id === selectedFiles[0]);
          if (selectedFile) {
            onRename(selectedFile);
          }
        }}
        onRefresh={onRefreshFiles}
        onClearFilter={onClearFilter}
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
      
      <AntFileList
        files={files}
        selectedFiles={selectedFiles}
        isLoading={filesLoading || isRefreshing}
        error={filesError}
        onFileClick={onFileItemClick}
        onFileSelect={onFileCheckboxChange}
        areAllSelected={selectedFiles.length > 0 && selectedFiles.length === files.length}
        showCheckboxes={true}
        favoritedFileIds={favoritedFileIds}
        onToggleFavorite={onToggleFavorite}
        fileUpdateTrigger={fileUpdateTrigger}
        onFileContextMenu={onFileContextMenu}
        onSelectAll={onSelectAllFiles}
        onDeselectAll={onDeselectAllFiles}
      />
    </div>
  );
}; 