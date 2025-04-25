import React, { useCallback, memo, useEffect } from 'react';
import { Breadcrumb as AntBreadcrumb, Button, Space, Badge } from 'antd';
import { Home, ChevronRight, ChevronLeft, FolderClosed, FileType } from 'lucide-react';
import styles from '@/app/components/features/file-management/navigation/breadcrumb/breadcrumb.module.css';
import { FolderPathItem } from '@/app/types';

interface BreadcrumbProps {
  folderPath: FolderPathItem[];
  showHome?: boolean;
  onNavigate?: (folderId: string | null) => void;
  onPathClick: (folderId: string | null) => void;
  onBackClick?: () => void;
  onClearFilter?: () => void;
  selectedFileType?: string | null;
}

export const Breadcrumb = memo(function Breadcrumb({ 
  folderPath = [],
  showHome = true, 
  onNavigate, 
  onPathClick,
  onBackClick,
  onClearFilter,
  selectedFileType
}: BreadcrumbProps) {
  // 向下兼容：如果有onNavigate但没有onPathClick，就使用onNavigate
  const handlePathClick = onPathClick || onNavigate;

  // 确保folderPath是数组
  const safeFolderPath = Array.isArray(folderPath) ? folderPath : [];

  // 监听folderPath变化，便于调试
  useEffect(() => {
    // 仅在开发环境打印，减少生产环境的日志
    if (process.env.NODE_ENV === 'development') {
      console.log('Breadcrumb路径已更新:', safeFolderPath);
    }
  }, [safeFolderPath]);

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

  // 使用antd Breadcrumb组件创建面包屑项
  const breadcrumbItems = [
    {
      title: (
        <span 
          className={styles.breadcrumbItem} 
          onClick={handleHomeClick}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Home size={16} />
          <span>主目录</span>
        </span>
      ),
      key: 'root'
    }
  ];

  // 添加文件夹路径项
  safeFolderPath.forEach((folder, index) => {
    breadcrumbItems.push({
      title: (
        <span 
          className={styles.breadcrumbItem} 
          onClick={() => handleFolderClick(folder.id)}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <FolderClosed size={14} />
          <span>{folder.name}</span>
        </span>
      ),
      key: `folder-${index}`
    });
  });

  return (
    <div className={styles.breadcrumb} data-path-length={safeFolderPath.length}>
      {onBackClick && safeFolderPath.length > 0 && (
        <Button 
          icon={<ChevronLeft size={16} />}
          size="small"
          type="text"
          onClick={handleBackButtonClick}
          title="返回上一级"
          aria-label="返回上一级"
          style={{ marginRight: '8px' }}
        />
      )}
      
      <AntBreadcrumb items={breadcrumbItems} separator={<ChevronRight size={14} />} />
      
      {/* 文件类型过滤器显示为单独标记，不会修改面包屑 */}
      {selectedFileType && onClearFilter && (
        <div style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '8px' }}>
          <Badge 
            count={
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '4px 8px',
                backgroundColor: 'var(--theme-primary, #3b82f6)',
                borderRadius: '12px',
                color: 'white'
              }}>
                <FileType size={14} style={{ marginRight: '4px' }} />
                <span>{selectedFileType}</span>
                <button 
                  onClick={onClearFilter}
                  style={{ 
                    marginLeft: '6px', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    color: 'white',
                    fontSize: '14px',
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>
            }
            offset={[0, 0]}
          />
        </div>
      )}
    </div>
  );
}); 