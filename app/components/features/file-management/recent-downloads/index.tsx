'use client';

import React from 'react';
import { Spin } from 'antd';
import { DownloadCloud } from 'lucide-react';
import { AntFileList } from '../../file-management/file-list/AntFileList';
import { FileInfo } from '@/app/types';

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

// 添加加载动画样式
const spinnerStyle = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .loading-spinner {
    animation: spin 1s linear infinite;
  }
`;

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
    <div>
      {/* 添加样式标签 */}
      <style dangerouslySetInnerHTML={{ __html: spinnerStyle }} />
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '16px 0' 
      }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DownloadCloud size={24} style={{ color: 'var(--theme-primary, #3b82f6)' }} />
          最近下载的文件
          {effectiveIsLoading && <small style={{marginLeft: '10px', fontSize: '12px', color: '#888'}}>(刷新中...)</small>}
        </h2>
      </div>
      
      {showLoadingIndicator && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div
            className="loading-spinner"
            style={{
              width: '40px',
              height: '40px',
              margin: '0 auto 20px',
              border: '3px solid rgba(52, 144, 220, 0.2)',
              borderTop: '3px solid #3490dc',
              borderRadius: '50%'
            }}
          />
          <p>加载最近下载文件... <span style={{color: 'gray', fontSize: '12px'}}>(loadingRecentDownloads={loadingRecentDownloads.toString()}, isLoading={isLoading.toString()})</span></p>
        </div>
      )}
      
      {showEmptyState && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 0',
          color: '#888'
        }}>
          <p>暂无最近下载的文件记录</p>
        </div>
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