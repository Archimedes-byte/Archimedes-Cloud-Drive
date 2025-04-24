'use client';

import React from 'react';
import { Spin } from 'antd';
import { Clock } from 'lucide-react';
import { FileList } from '../../file-management/file-list';
import { FileInfo } from '@/app/types';

interface RecentFilesContentProps {
  loadingRecentFiles: boolean;
  recentFiles: FileInfo[];
  selectedFiles: string[];
  favoritedFileIds: string[];
  fileUpdateTrigger: number;
  onFileClick: (file: FileInfo) => void;
  onFileSelect: (file: FileInfo, checked: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleFavorite: (file: FileInfo, isFavorite: boolean) => void;
}

export const RecentFilesContent: React.FC<RecentFilesContentProps> = ({
  loadingRecentFiles,
  recentFiles,
  selectedFiles,
  favoritedFileIds,
  fileUpdateTrigger,
  onFileClick,
  onFileSelect,
  onSelectAll,
  onDeselectAll,
  onToggleFavorite
}) => {
  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '16px 0' 
      }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={24} style={{ color: 'var(--theme-primary, #3b82f6)' }} />
          最近访问的文件
        </h2>
      </div>
      
      {loadingRecentFiles ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin />
          <p>加载最近访问文件...</p>
        </div>
      ) : recentFiles.length > 0 ? (
        <FileList 
          files={recentFiles}
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
        />
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 0',
          color: '#888'
        }}>
          <p>暂无最近访问的文件记录</p>
        </div>
      )}
    </div>
  );
}; 