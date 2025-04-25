'use client';

import React, { ReactNode } from 'react';
import { FileInfo } from '@/app/types';
import { Sidebar, FileType } from '../navigation/sidebar/Sidebar';
import MiniSidebar from '../navigation/mini-sidebar/MiniSidebar';
import { ThemePanel } from '@/app/components/ui/themes';
import styles from '../styles/page-layout.module.css';

// 添加ViewType类型定义，与Sidebar中一致
type ViewType = FileType | 'search' | 'favorites' | 'recent' | 'downloads' | 'tag' | 'shares';

interface PageLayoutProps {
  children: ReactNode;
  selectedFileType: FileType;
  currentView: ViewType | null;
  showThemePanel: boolean;
  previewFile: FileInfo | null;
  currentTheme: string;
  searchType: string;
  favoriteFoldersRefreshTrigger: number;
  onTypeClick: (type: FileType) => void;
  onSearchClick: (query?: string, searchType?: string) => void;
  onSharesClick: () => void;
  onFavoritesClick: (folderId?: string) => void;
  onCreateFavoriteFolder: () => void;
  onRecentClick: () => void;
  onRecentDownloadsClick: () => void;
  onThemeClick: () => void;
  onClosePreview: () => void;
  onThemeChange: (themeId: string) => Promise<boolean>;
  onCloseThemePanel: () => void;
  // MiniSidebar所需的额外属性
  avatarUrl: string | null;
  userName: string | null;
  userEmail: string | null;
  onHomeClick: () => void;
  onLogoutClick: () => void;
  onAvatarClick: () => void;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  selectedFileType,
  currentView,
  showThemePanel,
  previewFile,
  currentTheme,
  searchType,
  favoriteFoldersRefreshTrigger,
  onTypeClick,
  onSearchClick,
  onSharesClick,
  onFavoritesClick,
  onCreateFavoriteFolder,
  onRecentClick,
  onRecentDownloadsClick,
  onThemeClick,
  onClosePreview,
  onThemeChange,
  onCloseThemePanel,
  avatarUrl,
  userName,
  userEmail,
  onHomeClick,
  onLogoutClick,
  onAvatarClick
}) => {
  return (
    <div className={styles.pageLayout}>
      {/* 迷你侧边栏 */}
      <MiniSidebar 
        onThemeClick={onThemeClick}
        currentTheme={currentTheme}
        avatarUrl={avatarUrl}
        userName={userName}
        userEmail={userEmail}
        onHomeClick={onHomeClick}
        onLogoutClick={onLogoutClick}
        onAvatarClick={onAvatarClick}
      />

      {/* 侧边栏 - 仅在非主题模式下显示 */}
      {!showThemePanel && (
        <Sidebar
          selectedFileType={selectedFileType}
          onTypeClick={onTypeClick}
          onSearchClick={onSearchClick}
          onSharesClick={onSharesClick}
          onFavoritesClick={onFavoritesClick}
          onCreateFavoriteFolder={onCreateFavoriteFolder}
          onRecentClick={onRecentClick}
          onRecentDownloadsClick={onRecentDownloadsClick}
          refreshTrigger={favoriteFoldersRefreshTrigger}
          activeView={currentView || selectedFileType}
        />
      )}

      {/* 主内容区域 */}
      <div className={styles.mainContent}>
        {showThemePanel ? (
          /* 主题设置视图 */
          <ThemePanel 
            currentTheme={currentTheme}
            onThemeChange={onThemeChange}
            onClose={onCloseThemePanel}
          />
        ) : (
          children
        )}
      </div>
    </div>
  );
}; 