'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Spin, Typography, Empty, Table } from 'antd';
import { DownloadCloud } from 'lucide-react';
import { AntFileList } from '../../file-management/file-list/AntFileList';
import { FileInfo } from '@/app/types';
import styles from './RecentDownloads.module.css';
import { formatFileSize, FileIcon } from '@/app/utils/file';
import type { TableProps } from 'antd';

const { Title, Text } = Typography;

// 扩展的下载历史信息接口
interface DownloadHistoryInfo extends FileInfo {
  downloadedAt?: string;
}

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

// 专门为最近下载页面创建的文件列表组件
const DownloadHistoryFileList: React.FC<{
  files: DownloadHistoryInfo[];
  selectedFiles: string[];
  onFileClick: (file: FileInfo) => void;
  onFileSelect: (file: FileInfo, checked: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  areAllSelected?: boolean;
  showCheckboxes?: boolean;
  favoritedFileIds?: string[];
  onToggleFavorite?: (file: FileInfo, isFavorite: boolean) => void;
  fileUpdateTrigger?: number;
  isLoading?: boolean;
}> = ({
  files,
  selectedFiles,
  onFileClick,
  onFileSelect,
  onSelectAll,
  onDeselectAll,
  areAllSelected,
  showCheckboxes = true,
  favoritedFileIds = [],
  onToggleFavorite,
  fileUpdateTrigger = 0,
  isLoading = false,
}) => {
  // 基本上使用AntFileList的相同逻辑，但修改列配置
  return (
    <AntFileList
      files={files}
      selectedFiles={selectedFiles}
      onFileClick={onFileClick}
      onFileSelect={onFileSelect}
      onSelectAll={onSelectAll}
      onDeselectAll={onDeselectAll}
      areAllSelected={areAllSelected}
      showCheckboxes={showCheckboxes}
      favoritedFileIds={favoritedFileIds}
      onToggleFavorite={onToggleFavorite}
      fileUpdateTrigger={fileUpdateTrigger}
      isLoading={isLoading}
      // 自定义列配置，替换修改日期为下载日期
      customColumns={(defaultColumns) => {
        // 找到修改日期列的索引
        const updatedAtColumnIndex = defaultColumns.findIndex(
          (col: any) => col.key === 'updatedAt'
        );
        
        // 如果找到了修改日期列，替换为下载日期列
        if (updatedAtColumnIndex !== -1) {
          defaultColumns[updatedAtColumnIndex] = {
            title: '下载日期',
            dataIndex: 'downloadedAt',
            key: 'downloadedAt',
            width: 180,
            render: (_: any, record: DownloadHistoryInfo) => {
              const downloadedAt = record.downloadedAt || '';
              if (!downloadedAt) return '-';
              try {
                const date = new Date(downloadedAt);
                return date.toLocaleString();
              } catch (e) {
                return '-';
              }
            },
          };
        }
        
        return defaultColumns;
      }}
    />
  );
};

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
  const files = useMemo(() => recentDownloads as DownloadHistoryInfo[], [recentDownloads]);
  
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
        <DownloadHistoryFileList 
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