import React, { useCallback, useState } from 'react';
import { Home, LogOut, Palette, Users } from 'lucide-react';
import { Button, Avatar, Flex, Tooltip } from 'antd';
import { useRouter } from 'next/navigation';
import styles from './mini-sidebar.module.css';
import { useTheme } from '@/app/theme';
import { useProfile } from '@/app/hooks/user/useProfile';

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
  const router = useRouter();
  const [isClicked, setIsClicked] = useState(false);
  // 使用主题钩子
  const { themeStyle } = useTheme();
  // 使用profile钩子
  const { backgroundRefreshProfile } = useProfile();

  // 优化头像点击函数，立即跳转而不等待数据加载
  const handleAvatarClick = useCallback(() => {
    // 防止重复点击
    if (isClicked) return;
    
    setIsClicked(true);
    
    // 立即执行路由跳转到dashboard页面
    router.push('/dashboard');
    
    // 不阻塞UI的情况下在后台刷新资料
    requestAnimationFrame(() => {
      // 使用不阻塞UI的数据刷新方法
      backgroundRefreshProfile();
      setIsClicked(false);
    });
  }, [router, isClicked, backgroundRefreshProfile]);

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