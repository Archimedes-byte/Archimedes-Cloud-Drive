'use client';

import React from 'react';
import { Spin, Typography, Empty } from 'antd';
import { DownloadCloud } from 'lucide-react';
import { AntFileList } from '../../file-management/file-list/AntFileList';
import { FileInfo } from '@/app/types';
import styles from './RecentDownloads.module.css';

const { Title, Text } = Typography;

interface RecentDownloadsContentProps {
  loadingRecentDownloads: boolean;
  recentDownloads: FileInfo[];
  selectedFiles: string[];
  favoritedFileIds: string[];
  fileUpdateTrigger: number;
  onFileClick: (file: FileInfo) => void;
  onFileSelect: (file: FileInfo, checked: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleFavorite: (file: FileInfo, isFavorite: boolean) => void;
}

export const RecentDownloadsContent: React.FC<RecentDownloadsContentProps> = ({
  loadingRecentDownloads,
  recentDownloads,
  selectedFiles,
  favoritedFileIds,
  fileUpdateTrigger,
  onFileClick,
  onFileSelect,
  onSelectAll,
  onDeselectAll,
  onToggleFavorite
}) => {
  // 本地加载状态
  const [isLoading, setIsLoading] = React.useState(loadingRecentDownloads);
  
  // 同步props到本地状态
  React.useEffect(() => {
    if (isLoading !== loadingRecentDownloads) {
      console.log('🔄 RecentDownloadsContent - 更新加载状态:', loadingRecentDownloads);
      setIsLoading(loadingRecentDownloads);
    }
  }, [loadingRecentDownloads, isLoading]);
  
  // 当有数据时，确保不显示加载状态
  React.useEffect(() => {
    if (recentDownloads.length > 0 && isLoading) {
      console.log('📥 有下载数据，关闭加载状态');
      setIsLoading(false);
    }
  }, [recentDownloads, isLoading]);

  // 添加调试日志
  React.useEffect(() => {
    console.log('📌 RecentDownloadsContent 渲染:');
    console.log('- loadingRecentDownloads (props):', loadingRecentDownloads);
    console.log('- isLoading (local):', isLoading);
    console.log('- recentDownloads数量:', recentDownloads?.length || 0);
  }, [loadingRecentDownloads, isLoading, recentDownloads]);

  // 使用本地状态替代props状态
  const effectiveIsLoading = isLoading;

  // 更智能的加载状态逻辑
  const showLoadingIndicator = effectiveIsLoading && recentDownloads.length === 0;
  const showEmptyState = !effectiveIsLoading && recentDownloads.length === 0;
  const showContent = recentDownloads.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={2} className={styles.title}>
          <DownloadCloud size={24} className={styles.titleIcon} />
          最近下载的文件
          {effectiveIsLoading && <Text className={styles.refreshing}>(刷新中...)</Text>}
        </Title>
      </div>
      
      {showLoadingIndicator && (
        <div className={styles.loadingContainer}>
          <Spin 
            size="large" 
            tip="加载最近下载文件..."
          />
          <div className={styles.debugInfo}>
            (loadingRecentDownloads={loadingRecentDownloads.toString()}, isLoading={isLoading.toString()})
          </div>
        </div>
      )}
      
      {showEmptyState && (
        <Empty 
          description="暂无最近下载的文件记录" 
          className={styles.emptyState}
        />
      )}
      
      {showContent && (
        <AntFileList 
          files={recentDownloads}
          selectedFiles={selectedFiles}
          onFileClick={onFileClick}
          onFileSelect={onFileSelect}
          onSelectAll={onSelectAll}
          onDeselectAll={onDeselectAll}
          areAllSelected={false}
          showCheckboxes={true}
          favoritedFileIds={favoritedFileIds}
          onToggleFavorite={onToggleFavorite}
          fileUpdateTrigger={fileUpdateTrigger}
          isLoading={false}
        />
      )}
    </div>
  );
}; 