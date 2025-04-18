import React, { useCallback, memo } from 'react';
import { Home, ChevronRight, ChevronLeft } from 'lucide-react';
import styles from '@/app/file-management/styles/shared.module.css';
import { FolderPathItem } from '@/app/types';

interface BreadcrumbProps {
  folderPath: FolderPathItem[];
  showHome?: boolean;
  onNavigate?: (folderId: string | null) => void;
  onPathClick: (folderId: string | null) => void;
  onBackClick?: () => void;
}

export const Breadcrumb = memo(function Breadcrumb({ 
  folderPath = [],
  showHome = true, 
  onNavigate, 
  onPathClick,
  onBackClick
}: BreadcrumbProps) {
  // 向下兼容：如果有onNavigate但没有onPathClick，就使用onNavigate
  const handlePathClick = onPathClick || onNavigate;

  // 确保folderPath是数组
  const safeFolderPath = Array.isArray(folderPath) ? folderPath : [];

  // 使用useCallback优化点击事件处理函数，避免不必要的重新渲染
  const handleHomeClick = useCallback(() => {
    handlePathClick?.(null);
  }, [handlePathClick]);

  const handleFolderClick = useCallback((folderId: string) => {
    handlePathClick?.(folderId);
  }, [handlePathClick]);

  const handleBackButtonClick = useCallback(() => {
    onBackClick?.();
  }, [onBackClick]);

  if (!handlePathClick) {
    console.error('Breadcrumb组件缺少必要的onPathClick或onNavigate回调函数');
    return null;
  }

  return (
    <div className={styles.breadcrumb}>
      {onBackClick && safeFolderPath.length > 0 && (
        <button 
          className={styles.breadcrumbBackButton}
          onClick={handleBackButtonClick}
          title="返回上一级"
          aria-label="返回上一级"
        >
          <ChevronLeft size={16} />
        </button>
      )}
      
      {showHome && (
        <div className={styles.breadcrumbItem}>
          <button
            className={styles.breadcrumbLink}
            onClick={handleHomeClick}
            aria-label="根目录"
          >
            <Home size={16} className={styles.breadcrumbIcon} />
            根目录
          </button>
        </div>
      )}
      
      {safeFolderPath.map((folder) => (
        <React.Fragment key={folder.id}>
          <span className={styles.breadcrumbSeparator}>
            <ChevronRight size={14} />
          </span>
          <div className={styles.breadcrumbItem}>
            <button
              className={styles.breadcrumbLink}
              onClick={() => handleFolderClick(folder.id)}
              aria-label={`导航到${folder.name}`}
            >
              {folder.name}
            </button>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}); 