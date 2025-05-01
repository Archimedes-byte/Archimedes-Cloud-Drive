import React, { useCallback, memo, useEffect } from 'react';
import { Breadcrumb as AntBreadcrumb, Button, Space, Badge, Tooltip } from 'antd';
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

  // 构建面包屑项 - 使用AntD V5版本的items格式
  const breadcrumbItems = [
    {
      title: (
        <Tooltip title="返回主目录">
          <div 
            onClick={handleHomeClick}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            className={styles.breadcrumbItem}
          >
            <Home size={16} className={styles.breadcrumbIcon} />
            <span>主目录</span>
          </div>
        </Tooltip>
      )
    }
  ];

  // 添加文件夹路径项
  safeFolderPath.forEach((folder, index) => {
    // 判断是否为最后一个路径项，最后一个应显示为当前位置
    const isLastItem = index === safeFolderPath.length - 1;
    
    breadcrumbItems.push({
      title: (
        <Tooltip title={isLastItem ? "当前位置" : `跳转到 ${folder.name}`}>
          <div 
            onClick={() => handleFolderClick(folder.id)}
            style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              fontWeight: isLastItem ? '600' : '500',
              color: isLastItem ? 'var(--theme-primary, #3b82f6)' : undefined
            }}
            className={styles.breadcrumbItem}
          >
            <FolderClosed size={14} className={styles.breadcrumbIcon} />
            <span>{folder.name}</span>
          </div>
        </Tooltip>
      )
    });
  });

  return (
    <div className={styles.breadcrumb} data-path-length={safeFolderPath.length}>
      {onBackClick && safeFolderPath.length > 0 && (
        <Tooltip title="返回上一级">
          <Button 
            icon={<ChevronLeft size={16} />}
            size="small"
            type="text"
            onClick={handleBackButtonClick}
            aria-label="返回上一级"
            className={styles.breadcrumbBackButton}
          />
        </Tooltip>
      )}
      
      <AntBreadcrumb 
        items={breadcrumbItems} 
        separator={<ChevronRight size={14} className={styles.breadcrumbSeparator} />} 
      />
      
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
                color: 'white',
                boxShadow: '0 2px 5px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.3s ease'
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
                    lineHeight: 1,
                    opacity: 0.8,
                    transition: 'opacity 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '0.8'}
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