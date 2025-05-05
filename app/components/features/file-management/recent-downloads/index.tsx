'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  // 使用useMemo避免不必要的重新计算
  const files = useMemo(() => recentDownloads, [recentDownloads]);
  
  // 状态简化：使用计算属性而不是本地状态
  const isLoading = loadingRecentDownloads && files.length === 0;
  const isEmpty = !loadingRecentDownloads && files.length === 0;
  const hasContent = files.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={2} className={styles.title}>
          <DownloadCloud size={24} className={styles.titleIcon} />
          最近下载的文件
          {loadingRecentDownloads && <Text className={styles.refreshing}>(刷新中...)</Text>}
        </Title>
      </div>
      
      {isLoading && (
        <div className={styles.loadingContainer}>
          <Spin size="large">
            <div style={{ padding: '30px', textAlign: 'center' }}>
              加载最近下载文件...
            </div>
          </Spin>
        </div>
      )}
      
      {isEmpty && (
        <Empty 
          description="暂无最近下载的文件记录" 
          className={styles.emptyState}
        />
      )}
      
      {hasContent && (
        <AntFileList 
          files={files}
          selectedFiles={selectedFiles}
          onFileClick={onFileClick}
          onFileSelect={onFileSelect}
          onSelectAll={onSelectAll}
          onDeselectAll={onDeselectAll}
          areAllSelected={files.length > 0 && selectedFiles.length === files.length}
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