'use client';

import React, { useState, useEffect } from 'react';
// 导入useSession用于获取当前用户ID
import { useSession } from 'next-auth/react';
// 修改API导入路径为正确的路径
import { FileStatsService, FavoriteService } from '@/app/services/storage';
import { FileInfo } from '@/app/types';
// 使用刚创建的TimeSection组件
import { TimeSection } from './time-section';
import { Button } from 'antd';
import { AntFileList } from '../file-list/AntFileList';

// 创建服务实例
const fileStatsService = new FileStatsService();
const favoriteService = new FavoriteService();

// 添加函数用于按照时间段分组文件
const groupFilesByDate = (files: FileInfo[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const todayFiles: FileInfo[] = [];
  const yesterdayFiles: FileInfo[] = [];
  const pastWeekFiles: FileInfo[] = [];
  const olderFiles: FileInfo[] = [];
  
  files.forEach(file => {
    const fileDate = new Date(file.updatedAt || file.createdAt || new Date());
    fileDate.setHours(0, 0, 0, 0);
    
    if (fileDate.getTime() === today.getTime()) {
      todayFiles.push(file);
    } else if (fileDate.getTime() === yesterday.getTime()) {
      yesterdayFiles.push(file);
    } else if (fileDate >= oneWeekAgo) {
      pastWeekFiles.push(file);
    } else {
      olderFiles.push(file);
    }
  });
  
  return { todayFiles, yesterdayFiles, pastWeekFiles, olderFiles };
};

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

// 重命名为RecentFilesContent以匹配content-area.tsx中的导入
export function RecentFilesContent({
  loadingRecentFiles = false,
  recentFiles = [],
  selectedFiles = [],
  favoritedFileIds = [],
  fileUpdateTrigger = 0,
  onFileClick = (file: FileInfo) => console.log('File clicked:', file),
  onFileSelect = () => {},
  onSelectAll = () => {},
  onDeselectAll = () => {},
  onToggleFavorite = () => {}
}: {
  loadingRecentFiles?: boolean;
  recentFiles?: FileInfo[];
  selectedFiles?: string[];
  favoritedFileIds?: string[];
  fileUpdateTrigger?: number;
  onFileClick?: (file: FileInfo) => void;
  onFileSelect?: (file: FileInfo, checked: boolean) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onToggleFavorite?: (file: FileInfo, isFavorite: boolean) => void;
}) {
  // 获取当前用户会话
  const { data: session } = useSession();
  const [todayFiles, setTodayFiles] = useState<FileInfo[]>([]);
  const [yesterdayFiles, setYesterdayFiles] = useState<FileInfo[]>([]);
  const [pastWeekFiles, setPastWeekFiles] = useState<FileInfo[]>([]);
  const [olderFiles, setOlderFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(loadingRecentFiles);
  const [localSelectedFiles, setLocalSelectedFiles] = useState<string[]>(selectedFiles);
  const [localFavoritedFileIds, setLocalFavoritedFileIds] = useState<string[]>(favoritedFileIds);
  const [localFileUpdateTrigger, setLocalFileUpdateTrigger] = useState(fileUpdateTrigger);

  // 使用传入的props或本地状态
  const effectiveSelectedFiles = selectedFiles.length > 0 ? selectedFiles : localSelectedFiles;
  const effectiveFavoritedFileIds = favoritedFileIds.length > 0 ? favoritedFileIds : localFavoritedFileIds;
  const effectiveFileUpdateTrigger = fileUpdateTrigger || localFileUpdateTrigger;
  const effectiveIsLoading = loadingRecentFiles || isLoading;
  const effectiveRecentFiles = recentFiles.length > 0 ? recentFiles : [...todayFiles, ...yesterdayFiles, ...pastWeekFiles, ...olderFiles];

  // 添加调试日志
  useEffect(() => {
    console.log('📌 RecentFilesContent 渲染:');
    console.log('- loadingRecentFiles (props):', loadingRecentFiles);
    console.log('- isLoading (local):', isLoading);
    console.log('- effectiveIsLoading:', effectiveIsLoading);
    console.log('- recentFiles数量:', recentFiles?.length || 0);
  }, [loadingRecentFiles, isLoading, effectiveIsLoading, recentFiles]);

  // 强制同步props到本地state
  useEffect(() => {
    console.log('🔄 isLoading 状态更新:', loadingRecentFiles);
    // 防止不必要的状态更新和渲染循环
    if (isLoading !== loadingRecentFiles) {
      setIsLoading(loadingRecentFiles);
    }
  }, [loadingRecentFiles, isLoading]);

  // 初始加载数据
  useEffect(() => {
    if (recentFiles.length > 0) {
      // 如果传入了recentFiles，则使用传入的数据
      console.log('使用传入的recentFiles数据:', recentFiles.length);
      // 确保在有数据的情况下，不再显示加载状态
      if (isLoading) {
        setIsLoading(false);
      }
      return;
    }
    
    const loadRecentFiles = async () => {
      setIsLoading(true);
      try {
        // 确保session中有用户ID
        if (!session?.user?.id) {
          console.log('用户未登录或者会话中没有用户ID，跳过加载');
          setIsLoading(false);
          return;
        }
        
        // 获取最近文件
        const recentFiles = await fileStatsService.getRecentFiles(session.user.id, 20);
        
        // 按日期分组
        const { todayFiles: today, yesterdayFiles: yesterday, pastWeekFiles: pastWeek, olderFiles: older } = 
          groupFilesByDate(recentFiles);
        
        setTodayFiles(today);
        setYesterdayFiles(yesterday);
        setPastWeekFiles(pastWeek);
        setOlderFiles(older);
        
        // 获取所有文件的ID
        const allFileIds = recentFiles.map(f => f.id);
        
        // 批量获取收藏状态
        if (allFileIds.length > 0) {
          // 检查每个文件是否在收藏夹中
          const favoriteIds: string[] = [];
          for (const fileId of allFileIds) {
            if (await favoriteService.isInFavorites(session.user.id, fileId)) {
              favoriteIds.push(fileId);
            }
          }
          setLocalFavoritedFileIds(favoriteIds);
        }
      } catch (error) {
        console.error('Error loading recent files:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRecentFiles();
  }, [recentFiles, session]);

  // 处理文件点击
  const handleFileClick = (file: FileInfo) => {
    // 使用传入的onFileClick或默认处理
    onFileClick(file);
  };

  // 处理文件选择
  const handleFileSelect = (file: FileInfo, checked: boolean) => {
    if (onFileSelect) {
      onFileSelect(file, checked);
    } else {
      setLocalSelectedFiles(prev => {
        if (checked) {
          return [...prev, file.id];
        } else {
          return prev.filter(id => id !== file.id);
        }
      });
    }
  };

  // 全选文件
  const handleSelectAll = (files: FileInfo[]) => {
    if (onSelectAll) {
      onSelectAll();
    } else {
      const fileIds = files.map(file => file.id);
      setLocalSelectedFiles(prev => {
        const newSelection = [...prev];
        fileIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  // 取消全选
  const handleDeselectAll = (files: FileInfo[]) => {
    if (onDeselectAll) {
      onDeselectAll();
    } else {
      const fileIds = files.map(file => file.id);
      setLocalSelectedFiles(prev => prev.filter(id => !fileIds.includes(id)));
    }
  };

  // 处理收藏/取消收藏
  const handleToggleFavorite = async (file: FileInfo, isFavorite: boolean) => {
    if (onToggleFavorite) {
      onToggleFavorite(file, isFavorite);
    } else {
      try {
        // 确保有会话
        if (!session?.user?.id) {
          console.error('无法修改收藏状态：未登录');
          return;
        }
        
        if (isFavorite) {
          await favoriteService.addToFolder(session.user.id, file.id);
          setLocalFavoritedFileIds(prev => [...prev, file.id]);
        } else {
          await favoriteService.removeFromFolder(session.user.id, file.id);
          setLocalFavoritedFileIds(prev => prev.filter(id => id !== file.id));
        }
        setLocalFileUpdateTrigger(prev => prev + 1);
      } catch (error) {
        console.error('Error toggling favorite status:', error);
      }
    }
  };

  // 更智能的加载状态逻辑
  const showLoadingIndicator = effectiveIsLoading && effectiveRecentFiles.length === 0;
  const showEmptyState = !effectiveIsLoading && effectiveRecentFiles.length === 0;
  const showContent = effectiveRecentFiles.length > 0;

  return (
    <div className="recent-files-container">
      {/* 添加样式标签 */}
      <style dangerouslySetInnerHTML={{ __html: spinnerStyle }} />
      
      <h2 style={{ 
        fontSize: '20px', 
        fontWeight: 600, 
        margin: '0 0 20px 0',
        color: '#1f2937'
      }}>
        最近访问的文件
        {effectiveIsLoading && <small style={{marginLeft: '10px', fontSize: '12px', color: '#888'}}>(刷新中...)</small>}
      </h2>

      {showLoadingIndicator && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div 
            style={{
              width: '40px',
              height: '40px',
              margin: '0 auto 20px',
              border: '3px solid rgba(52, 144, 220, 0.2)',
              borderTop: '3px solid #3490dc',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
            className="loading-spinner"
          ></div>
          <p>加载中，请稍候... <span style={{color: 'gray', fontSize: '12px'}}>(loadingRecentFiles={loadingRecentFiles.toString()}, isLoading={isLoading.toString()})</span></p>
        </div>
      )}

      {showEmptyState && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 0',
          color: '#888',
          backgroundColor: 'rgba(247, 250, 252, 0.5)',
          borderRadius: '12px',
          border: '1px dashed #e2e8f0',
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            lineHeight: '60px',
            fontSize: '24px',
            margin: '0 auto 15px',
            backgroundColor: 'rgba(226, 232, 240, 0.5)',
            borderRadius: '50%',
          }}>
            📂
          </div>
          <p>暂无最近访问的文件</p>
          <p style={{ fontSize: '14px', color: '#999', maxWidth: '300px', margin: '10px auto' }}>
            浏览或搜索文件后，它们将显示在这里
          </p>
          <Button type="primary" style={{ marginTop: '10px' }}>
            浏览全部文件
          </Button>
        </div>
      )}

      {showContent && (
        <>
          {recentFiles.length > 0 ? (
            <AntFileList 
              files={recentFiles}
              selectedFiles={effectiveSelectedFiles}
              onFileClick={handleFileClick}
              onFileSelect={handleFileSelect}
              onSelectAll={onSelectAll}
              onDeselectAll={onDeselectAll}
              areAllSelected={recentFiles.every(file => effectiveSelectedFiles.includes(file.id))}
              showCheckboxes={true}
              favoritedFileIds={effectiveFavoritedFileIds}
              onToggleFavorite={handleToggleFavorite}
              fileUpdateTrigger={effectiveFileUpdateTrigger}
              isLoading={false}
            />
          ) : (
            <>
              {todayFiles.length > 0 && (
                <TimeSection 
                  title="今天" 
                  files={todayFiles}
                  selectedFiles={effectiveSelectedFiles}
                  favoritedFileIds={effectiveFavoritedFileIds}
                  fileUpdateTrigger={effectiveFileUpdateTrigger}
                  FileListComponent={
                    <AntFileList 
                      files={todayFiles}
                      selectedFiles={effectiveSelectedFiles}
                      onFileClick={handleFileClick}
                      onFileSelect={handleFileSelect}
                      onSelectAll={() => handleSelectAll(todayFiles)}
                      onDeselectAll={() => handleDeselectAll(todayFiles)}
                      areAllSelected={todayFiles.every(file => effectiveSelectedFiles.includes(file.id))}
                      showCheckboxes={true}
                      favoritedFileIds={effectiveFavoritedFileIds}
                      onToggleFavorite={handleToggleFavorite}
                      fileUpdateTrigger={effectiveFileUpdateTrigger}
                      isLoading={false}
                    />
                  }
                />
              )}
              
              {yesterdayFiles.length > 0 && (
                <TimeSection 
                  title="昨天" 
                  files={yesterdayFiles}
                  selectedFiles={effectiveSelectedFiles}
                  favoritedFileIds={effectiveFavoritedFileIds}
                  fileUpdateTrigger={effectiveFileUpdateTrigger}
                  FileListComponent={
                    <AntFileList 
                      files={yesterdayFiles}
                      selectedFiles={effectiveSelectedFiles}
                      onFileClick={handleFileClick}
                      onFileSelect={handleFileSelect}
                      onSelectAll={() => handleSelectAll(yesterdayFiles)}
                      onDeselectAll={() => handleDeselectAll(yesterdayFiles)}
                      areAllSelected={yesterdayFiles.every(file => effectiveSelectedFiles.includes(file.id))}
                      showCheckboxes={true}
                      favoritedFileIds={effectiveFavoritedFileIds}
                      onToggleFavorite={handleToggleFavorite}
                      fileUpdateTrigger={effectiveFileUpdateTrigger}
                      isLoading={false}
                    />
                  }
                />
              )}
              
              {pastWeekFiles.length > 0 && (
                <TimeSection 
                  title="过去一周" 
                  files={pastWeekFiles}
                  selectedFiles={effectiveSelectedFiles}
                  favoritedFileIds={effectiveFavoritedFileIds}
                  fileUpdateTrigger={effectiveFileUpdateTrigger}
                  FileListComponent={
                    <AntFileList 
                      files={pastWeekFiles}
                      selectedFiles={effectiveSelectedFiles}
                      onFileClick={handleFileClick}
                      onFileSelect={handleFileSelect}
                      onSelectAll={() => handleSelectAll(pastWeekFiles)}
                      onDeselectAll={() => handleDeselectAll(pastWeekFiles)}
                      areAllSelected={pastWeekFiles.every(file => effectiveSelectedFiles.includes(file.id))}
                      showCheckboxes={true}
                      favoritedFileIds={effectiveFavoritedFileIds}
                      onToggleFavorite={handleToggleFavorite}
                      fileUpdateTrigger={effectiveFileUpdateTrigger}
                      isLoading={false}
                    />
                  }
                />
              )}
              
              {olderFiles.length > 0 && (
                <TimeSection 
                  title="更早" 
                  files={olderFiles}
                  selectedFiles={effectiveSelectedFiles}
                  favoritedFileIds={effectiveFavoritedFileIds}
                  fileUpdateTrigger={effectiveFileUpdateTrigger}
                  FileListComponent={
                    <AntFileList 
                      files={olderFiles}
                      selectedFiles={effectiveSelectedFiles}
                      onFileClick={handleFileClick}
                      onFileSelect={handleFileSelect}
                      onSelectAll={() => handleSelectAll(olderFiles)}
                      onDeselectAll={() => handleDeselectAll(olderFiles)}
                      areAllSelected={olderFiles.every(file => effectiveSelectedFiles.includes(file.id))}
                      showCheckboxes={true}
                      favoritedFileIds={effectiveFavoritedFileIds}
                      onToggleFavorite={handleToggleFavorite}
                      fileUpdateTrigger={effectiveFileUpdateTrigger}
                      isLoading={false}
                    />
                  }
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
} 