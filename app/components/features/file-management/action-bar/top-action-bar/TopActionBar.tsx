import React from 'react';
import MenuBar from '@/app/components/features/file-management/action-bar/menu-bar';

export interface TopActionBarProps {
  selectedFiles: any[];
  onClearSelection: () => void;
  onDownload: () => void;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
  onShare: () => void;
  onCreateFolder: () => void;
  onClearFilter: () => void;
  selectedFileType: any | null;
  showSearchView: boolean;
  isInRootFolder: boolean;
  sortOrder: any;
  onSortChange: (order: any) => void;
  setIsUploadModalOpen: (open: boolean) => void;
  setIsFolderUploadModalOpen: (open: boolean) => void;
  onUploadClick?: () => void;
  onFolderUploadClick?: () => void;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  showUploadDropdown?: boolean;
  setShowUploadDropdown?: (show: boolean) => void;
  uploadDropdownRef?: React.RefObject<HTMLDivElement>;
}

/**
 * 顶部操作栏组件，现在使用统一的MenuBar组件实现
 * @version 3.0.0
 */
export const TopActionBar: React.FC<TopActionBarProps> = (props) => {
  // 简单地透传所有属性到MenuBar组件
  return (
    <MenuBar
      selectedFiles={props.selectedFiles}
      onClearSelection={props.onClearSelection}
      onDownload={props.onDownload}
      onRename={props.onRename}
      onMove={props.onMove}
      onDelete={props.onDelete}
      onShare={props.onShare}
      selectedFileType={props.selectedFileType}
      showSearchView={props.showSearchView}
      isInRootFolder={props.isInRootFolder}
      onClearFilter={props.onClearFilter}
      sortOrder={props.sortOrder}
      onSortChange={props.onSortChange}
      setIsUploadModalOpen={props.setIsUploadModalOpen}
      setIsFolderUploadModalOpen={props.setIsFolderUploadModalOpen}
      onUploadClick={props.onUploadClick}
      onFolderUploadClick={props.onFolderUploadClick}
      onCreateFolder={props.onCreateFolder}
    />
  );
}; 