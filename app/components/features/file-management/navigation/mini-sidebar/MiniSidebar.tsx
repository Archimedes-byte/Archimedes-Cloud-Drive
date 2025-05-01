import React, { useCallback } from 'react';
import { Home, LogOut, Palette } from 'lucide-react';
import { Button, Avatar, Flex, Tooltip } from 'antd';
import styles from './mini-sidebar.module.css';
import { useTheme } from '@/app/theme';

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
  // 使用主题钩子
  const { themeStyle } = useTheme();

  // 优化回调函数，避免不必要的重新创建
  const handleAvatarClick = useCallback(() => {
    onAvatarClick();
  }, [onAvatarClick]);

  const handleHomeClick = useCallback(() => {
    onHomeClick();
  }, [onHomeClick]);

  const handleThemeClick = useCallback(() => {
    onThemeClick();
  }, [onThemeClick]);

  const handleLogoutClick = useCallback(() => {
    onLogoutClick();
  }, [onLogoutClick]);

  // 获取用户头像初始字符
  const getAvatarText = useCallback(() => {
    return userName?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase() || '?';
  }, [userName, userEmail]);

  return (
    <Flex 
      vertical
      className={styles.miniSidebar}
      align="center"
      justify="flex-start"
    >
      <div className={styles.patternOverlay}></div>
      <div className={styles.avatarContainer}>
        <Button 
          className={styles.miniSidebarButton}
          onClick={handleAvatarClick}
          type="text"
        >
          {avatarUrl ? (
            <Avatar 
              src={avatarUrl} 
              size={38} 
              className="ring-1 ring-white/50 transition-all duration-300 hover:ring-2"
            />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {getAvatarText()}
            </div>
          )}
        </Button>
      </div>
      
      <div className={styles.miniSidebarDivider}></div>
      
      <Button 
        className={styles.miniSidebarButton}
        onClick={handleHomeClick}
        type="text"
      >
        <Home className={styles.iconStyle} />
      </Button>
      
      {/* 主题选择按钮 */}
      <Button 
        className={styles.miniSidebarButton}
        onClick={handleThemeClick}
        title="主题设置"
        type="text"
      >
        <Palette className={styles.iconStyle} />
      </Button>
      
      <Button 
        className={styles.miniSidebarButton}
        onClick={handleLogoutClick}
        type="text"
      >
        <LogOut className={styles.iconStyle} />
      </Button>
    </Flex>
  );
};

// 使用React.memo优化组件，避免不必要的重渲染
export default React.memo(MiniSidebar); 