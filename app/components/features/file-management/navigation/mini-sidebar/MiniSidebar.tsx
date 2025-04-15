import React from 'react';
import Image from 'next/image';
import { Home, LogOut, Palette } from 'lucide-react';
import styles from '@/app/file-management/styles/shared.module.css';

interface MiniSidebarProps {
  avatarUrl: string | null;
  userName: string | null;
  userEmail: string | null;
  onHomeClick: () => void;
  onLogoutClick: () => void;
  onAvatarClick: () => void;
  currentTheme?: string | null;
  onThemeClick: () => void;
}

const MiniSidebar: React.FC<MiniSidebarProps> = ({
  avatarUrl,
  userName,
  userEmail,
  onHomeClick,
  onLogoutClick,
  onAvatarClick,
  currentTheme = 'default',
  onThemeClick
}) => {
  return (
    <div className={styles.miniSidebar}>
      <div className={styles.patternOverlay}></div>
      <div className={styles.avatarContainer}>
        <button 
          className={styles.miniSidebarButton}
          onClick={onAvatarClick}
        >
          {avatarUrl ? (
            <Image
              src={`${avatarUrl}?t=${Date.now()}`}
              alt="用户头像"
              width={38}
              height={38}
              className="rounded-full ring-1 ring-white/50 transition-all duration-300 hover:ring-2"
            />
          ) : (
            <div 
              className={styles.avatarPlaceholder}
              style={{ width: '38px', height: '38px', fontSize: '16px' }}
            >
              {userName?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </button>
      </div>
      <div className={styles.miniSidebarDivider}></div>
      <button 
        className={styles.miniSidebarButton}
        onClick={onHomeClick}
      >
        <Home className="w-5 h-5 text-white" />
      </button>
      
      {/* 主题选择按钮 */}
      <button 
        className={styles.miniSidebarButton}
        onClick={onThemeClick}
        title="主题设置"
      >
        <Palette className="w-5 h-5 text-white" />
      </button>
      
      <button 
        className={styles.miniSidebarButton}
        onClick={onLogoutClick}
      >
        <LogOut className="w-5 h-5 text-white" />
      </button>
    </div>
  );
};

export default MiniSidebar; 