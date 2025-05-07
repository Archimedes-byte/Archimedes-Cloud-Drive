import React, { useCallback, useState, useEffect } from 'react';
import { Home, LogOut, Palette, Users } from 'lucide-react';
import { Button, Avatar, Flex, Tooltip } from 'antd';
import { useRouter } from 'next/navigation';
import styles from './mini-sidebar.module.css';
import { useTheme } from '@/app/hooks';
import { useProfile } from '@/app/hooks/user/useProfile';
import { applyTheme } from '@/app/theme/theme-service';

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
  
  // 确保主题变量在页面间保持一致性
  useEffect(() => {
    // 确保DOM中应用了正确的主题类
    if (typeof document !== 'undefined') {
      document.body.classList.add('theme-background-applied');
      
      // 如果在不同页面间切换，主动应用当前主题
      if (currentTheme) {
        setTimeout(() => {
          // 短暂延迟确保DOM已完全挂载
          applyTheme(currentTheme, false);
        }, 0);
      }
    }
    
    return () => {
      // 清理函数，避免类残留
      if (typeof document !== 'undefined') {
        // 这里不需要移除theme-background-applied类，避免主题闪烁
      }
    };
  }, [currentTheme]);

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
  
  // 统一的按钮样式，确保在不同页面间保持尺寸一致
  const buttonStyle = {
    width: '50px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '14px',
    background: 'transparent',
    border: 'none',
    boxShadow: 'none',
  };
  
  const iconStyle = {
    color: 'white',
    width: '20px',
    height: '20px',
  };

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
          style={buttonStyle}
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
        style={buttonStyle}
      >
        <Home style={iconStyle} />
      </Button>
      
      
      {/* 主题选择按钮 */}
      <Button 
        className={styles.miniSidebarButton}
        onClick={handleThemeClick}
        title="主题设置"
        type="text"
        style={buttonStyle}
      >
        <Palette style={iconStyle} />
      </Button>
      
      <Button 
        className={styles.miniSidebarButton}
        onClick={handleLogoutClick}
        type="text"
        style={buttonStyle}
      >
        <LogOut style={iconStyle} />
      </Button>
    </Flex>
  );
};

// 使用React.memo优化组件，避免不必要的重渲染
export default React.memo(MiniSidebar); 