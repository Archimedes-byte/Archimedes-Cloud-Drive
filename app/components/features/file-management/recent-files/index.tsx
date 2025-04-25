'use client';

import React, { useState, useEffect } from 'react';
// 修改API导入路径为正确的路径
import { getTodayFiles, getYesterdayFiles, getPastWeekFiles, getOlderFiles } from '@/app/api/files/recent';
import { addFavorite, removeFavorite, getBatchFavoriteStatus } from '@/app/api/files/favorites';
import { FileInfo } from '@/app/types';
// 使用刚创建的TimeSection组件
import { TimeSection } from './time-section';
import { Button } from 'antd';
import { AntFileList } from '../file-list/AntFileList';

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

  // 初始加载数据
  useEffect(() => {
    if (recentFiles.length > 0) {
      // 如果传入了recentFiles，则使用传入的数据
      return;
    }
    
    const loadRecentFiles = async () => {
      setIsLoading(true);
      try {
        const today = await getTodayFiles();
        const yesterday = await getYesterdayFiles();
        const pastWeek = await getPastWeekFiles();
        const older = await getOlderFiles();
        
        setTodayFiles(today);
        setYesterdayFiles(yesterday);
        setPastWeekFiles(pastWeek);
        setOlderFiles(older);
        
        // 获取所有文件的ID
        const allFileIds = [
          ...today.map((f: FileInfo) => f.id),
          ...yesterday.map((f: FileInfo) => f.id),
          ...pastWeek.map((f: FileInfo) => f.id),
          ...older.map((f: FileInfo) => f.id)
        ];
        
        // 批量获取收藏状态
        if (allFileIds.length > 0) {
          const favoriteStatus = await getBatchFavoriteStatus(allFileIds);
          setLocalFavoritedFileIds(favoriteStatus);
        }
      } catch (error) {
        console.error('Error loading recent files:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRecentFiles();
  }, [recentFiles]);

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
        if (isFavorite) {
          await addFavorite(file.id);
          setLocalFavoritedFileIds(prev => [...prev, file.id]);
        } else {
          await removeFavorite(file.id);
          setLocalFavoritedFileIds(prev => prev.filter(id => id !== file.id));
        }
        setLocalFileUpdateTrigger(prev => prev + 1);
      } catch (error) {
        console.error('Error toggling favorite status:', error);
      }
    }
  };

  return (
    <div className="recent-files-container">
      <h2 style={{ 
        fontSize: '20px', 
        fontWeight: 600, 
        margin: '0 0 20px 0',
        color: '#1f2937'
      }}>
        最近访问的文件
      </h2>

      {effectiveIsLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{
            width: '40px',
            height: '40px',
            margin: '0 auto 20px',
            border: '3px solid rgba(52, 144, 220, 0.2)',
            borderTop: '3px solid #3490dc',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}></div>
          <p>加载中，请稍候...</p>
        </div>
      ) : (
        <>
          {effectiveRecentFiles.length === 0 ? (
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
          ) : (
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
                        />
                      }
                    />
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      <style jsx>{`
        .recent-files-container {
          padding: 20px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// 保持向后兼容性，同时导出RecentFiles
export { RecentFilesContent as RecentFiles }; 