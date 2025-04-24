import React, { useEffect, useRef } from 'react';
import styles from '@/app/file-management/styles/shared.module.css';
import { FileInfo, FileSortInterface, FileTypeEnum } from '@/app/types';
import { FileActions } from './FileActions';
import { FileBrowseActions } from './FileBrowseActions';
import { UploadActions } from './UploadActions';

export interface TopActionBarProps {
  selectedFiles: FileInfo[];
  onClearSelection: () => void;
  onDownload: () => void;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
  onShare: () => void;
  onClearFilter: () => void;
  onCreateFolder: () => void;
  selectedFileType: FileTypeEnum | null;
  showSearchView: boolean;
  isInRootFolder: boolean;
  sortOrder: FileSortInterface;
  onSortChange: (order: FileSortInterface) => void;
  showUploadDropdown: boolean;
  setShowUploadDropdown: (show: boolean) => void;
  setIsUploadModalOpen: (open: boolean) => void;
  setIsFolderUploadModalOpen: (open: boolean) => void;
  uploadDropdownRef: React.RefObject<HTMLDivElement>;
  onUploadClick?: () => void;
  onFolderUploadClick?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

/**
 * 顶部操作栏组件
 * 显示当前文件操作的各种按钮和状态
 * 
 * @version 2.0.0
 * @deprecated 不要直接使用此组件，应该使用拆分后的子组件
 */
export const TopActionBar: React.FC<TopActionBarProps> = (props) => {
  // 创建本地ref引用以在组件内部追踪下拉菜单
  const localDropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = props.uploadDropdownRef || localDropdownRef;
  
  // 添加点击外部关闭下拉菜单的效果
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        // 检查setShowUploadDropdown是否为函数
        if (typeof props.setShowUploadDropdown === 'function') {
          props.setShowUploadDropdown(false);
        }
      }
    };
    
    // 添加点击事件监听器
    document.addEventListener('mousedown', handleClickOutside);
    
    // 清理
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef, props.setShowUploadDropdown]);
  
  return (
    <div className={styles.topBar}>
      <div className={styles.buttonGroup}>
        {props.selectedFiles.length > 0 ? (
          // 文件选中状态显示文件操作按钮
          <FileActions 
            selectedFiles={props.selectedFiles}
            onClearSelection={props.onClearSelection}
            onDownload={props.onDownload}
            onRename={props.onRename}
            onMove={props.onMove}
            onDelete={props.onDelete}
            onShare={props.onShare}
          />
        ) : (
          // 未选中文件时显示浏览和上传操作
          <>
            {/* 文件浏览相关按钮 */}
            <FileBrowseActions 
              selectedFileType={props.selectedFileType}
              showSearchView={props.showSearchView}
              isInRootFolder={props.isInRootFolder}
              onClearFilter={props.onClearFilter}
              sortOrder={props.sortOrder}
              onSortChange={props.onSortChange}
            />
            
            {/* 上传相关按钮 */}
            <UploadActions 
              setIsUploadModalOpen={props.setIsUploadModalOpen}
              setIsFolderUploadModalOpen={props.setIsFolderUploadModalOpen}
              onUploadClick={props.onUploadClick}
              onFolderUploadClick={props.onFolderUploadClick}
              onCreateFolder={props.onCreateFolder}
              onRefresh={props.onRefresh}
              isRefreshing={props.isRefreshing}
            />
          </>
        )}
      </div>
    </div>
  );
}; 