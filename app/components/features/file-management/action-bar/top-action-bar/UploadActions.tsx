import React, { useEffect, useRef } from 'react';
import { 
  Upload, FolderUp
} from 'lucide-react';
import styles from '@/app/file-management/styles/shared.module.css';

interface UploadActionsProps {
  setIsUploadModalOpen: (open: boolean) => void;
  setIsFolderUploadModalOpen: (open: boolean) => void;
  onUploadClick?: () => void;
  onFolderUploadClick?: () => void;
  onCreateFolder: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

/**
 * 上传操作组件 - 负责处理文件上传相关的操作按钮
 */
export const UploadActions: React.FC<UploadActionsProps> = ({
  setIsUploadModalOpen = () => {},
  setIsFolderUploadModalOpen = () => {},
  onUploadClick,
  onFolderUploadClick,
  onCreateFolder,
  onRefresh,
  isRefreshing = false
}) => {
  return (
    <>
      {/* 上传文件按钮 */}
      <button 
        className={styles.topButton}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onUploadClick) {
            onUploadClick();
          } else {
            setIsUploadModalOpen(true);
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <Upload size={16} />
        上传文件
      </button>
      
      {/* 上传文件夹按钮 */}
      <button 
        className={styles.topButton}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onFolderUploadClick) {
            onFolderUploadClick();
          } else {
            setIsFolderUploadModalOpen(true);
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <FolderUp size={16} />
        上传文件夹
      </button>
      
      {/* 新建文件夹按钮 */}
      <button className={styles.topButton} onClick={onCreateFolder}>
        <span>📁</span>
        新建文件夹
      </button>
      
      {/* 刷新按钮 */}
      {onRefresh && (
        <button 
          className={styles.topButton} 
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <span className={isRefreshing ? styles.rotating : ''}>🔄</span>
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      )}
    </>
  );
}; 