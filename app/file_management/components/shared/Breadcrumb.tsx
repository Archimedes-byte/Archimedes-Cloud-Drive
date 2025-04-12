import React from 'react';
import { Home, ChevronRight, ChevronLeft } from 'lucide-react';
import styles from '../../styles/shared.module.css';
import { FolderPathItem } from '@/app/types';

interface BreadcrumbProps {
  folderPath: FolderPathItem[];
  showHome?: boolean;
  onNavigate?: (folderId: string | null) => void;
  onPathClick: (folderId: string | null) => void;
  onBackClick?: () => void;
}

export function Breadcrumb({ 
  folderPath, 
  showHome = true, 
  onNavigate, 
  onPathClick,
  onBackClick
}: BreadcrumbProps) {
  // 向下兼容：如果有onNavigate但没有onPathClick，就使用onNavigate
  const handlePathClick = onPathClick || onNavigate;

  if (!handlePathClick) {
    console.error('Breadcrumb组件缺少必要的onPathClick或onNavigate回调函数');
    return null;
  }

  return (
    <div className={styles.breadcrumb}>
      {onBackClick && folderPath.length > 0 && (
        <button 
          className={styles.breadcrumbBackButton}
          onClick={onBackClick}
          title="返回上一级"
        >
          <ChevronLeft size={16} />
        </button>
      )}
      
      {showHome && (
        <div className={styles.breadcrumbItem}>
          <button
            className={styles.breadcrumbLink}
            onClick={() => handlePathClick(null)}
          >
            <Home size={16} className={styles.breadcrumbIcon} />
            根目录
          </button>
        </div>
      )}
      
      {folderPath.map((folder) => (
        <React.Fragment key={folder.id}>
          <span className={styles.breadcrumbSeparator}>
            <ChevronRight size={14} />
          </span>
          <div className={styles.breadcrumbItem}>
            <button
              className={styles.breadcrumbLink}
              onClick={() => handlePathClick(folder.id)}
            >
              {folder.name}
            </button>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
} 