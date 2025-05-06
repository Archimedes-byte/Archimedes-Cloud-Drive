'use client';

import React, { useCallback, useState } from 'react';
import { Layout, Avatar, Button, Tooltip, Divider, theme } from 'antd';
import { 
  HomeOutlined, LogoutOutlined, BgColorsOutlined, 
  UserOutlined 
} from '@ant-design/icons';
import styles from './mini-sidebar.module.css';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/app/hooks/user/useProfile';

const { Sider } = Layout;
const { useToken } = theme;

interface AntMiniSidebarProps {
  avatarUrl: string | null;
  userName: string | null;
  userEmail: string | null;
  onHomeClick: () => void;
  onLogoutClick: () => void;
  onAvatarClick: () => void;
  currentTheme?: string | null;
  onThemeClick: () => void;
}

// 使用React.memo优化组件
const AntMiniSidebar = React.memo(function AntMiniSidebar({
  avatarUrl,
  userName,
  userEmail,
  onHomeClick,
  onLogoutClick,
  onAvatarClick,
  currentTheme = 'default',
  onThemeClick
}: AntMiniSidebarProps) {
  // 获取antd主题token
  const { token } = useToken();
  const router = useRouter();
  const [isClicked, setIsClicked] = useState(false);
  // 使用profile钩子获取优化的刷新方法
  const { backgroundRefreshProfile } = useProfile();

  // 处理头像点击，优化性能
  const handleAvatarClick = useCallback(() => {
    // 防止重复点击
    if (isClicked) return;
    
    setIsClicked(true);
    
    // 立即执行路由跳转到dashboard页面
    router.push('/dashboard');
    
    // 使用requestAnimationFrame确保UI绘制优先，避免阻塞
    requestAnimationFrame(() => {
      // 使用不阻塞UI的后台刷新方法
      backgroundRefreshProfile();
      setIsClicked(false);
    });
  }, [router, isClicked, backgroundRefreshProfile]);

  // 获取用户首字母作为头像显示
  const getAvatarText = useCallback(() => {
    if (userName && typeof userName === 'string' && userName.trim().length > 0) {
      return userName.trim()[0].toUpperCase();
    }
    if (userEmail && typeof userEmail === 'string' && userEmail.trim().length > 0) {
      return userEmail.trim()[0].toUpperCase();
    }
    return '?';
  }, [userName, userEmail]);

  // 计算渐变背景 - 使用主题颜色
  const gradientBackground = `linear-gradient(to bottom, ${token.colorPrimary}, ${token.colorPrimaryActive})`;

  // 确保即使在会话丢失时也能正常渲染
  const safeAvatarUrl = avatarUrl || null;
  const safeUserName = userName || null;
  const safeUserEmail = userEmail || null;

  return (
    <Sider
      width={72}
      style={{ background: gradientBackground, position: 'fixed', left: 0, boxShadow: token.boxShadowSecondary }}
      className={styles.miniSidebar}
    >
      <div className={styles.avatarContainer}>
        <Tooltip title={safeUserName || safeUserEmail || '用户信息'} placement="right">
          <Button 
            type="text" 
            shape="circle" 
            onClick={handleAvatarClick}
            style={{ padding: 0 }}
          >
            {safeAvatarUrl ? (
              <Avatar 
                src={safeAvatarUrl} 
                size={38} 
                className={styles.avatar}
              />
            ) : (
              <Avatar 
                size={38} 
                className={styles.avatarPlaceholder}
              >
                {getAvatarText()}
              </Avatar>
            )}
          </Button>
        </Tooltip>
      </div>

      <Divider className={styles.miniSidebarDivider} />

      <div className={styles.buttonContainer}>
        <Tooltip title="主页" placement="right">
          <Button 
            type="text" 
            shape="circle" 
            icon={<HomeOutlined className={styles.iconStyle} />} 
            onClick={onHomeClick}
            className={styles.miniSidebarButton}
          />
        </Tooltip>
        
        <Tooltip title="主题设置" placement="right">
          <Button 
            type="text" 
            shape="circle" 
            icon={<BgColorsOutlined className={styles.iconStyle} />} 
            onClick={onThemeClick}
            className={styles.miniSidebarButton}
          />
        </Tooltip>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <Tooltip title="退出登录" placement="right">
          <Button 
            type="text" 
            shape="circle" 
            icon={<LogoutOutlined className={styles.iconStyle} />} 
            onClick={onLogoutClick}
            className={styles.miniSidebarButton}
          />
        </Tooltip>
      </div>
    </Sider>
  );
});

export default AntMiniSidebar; 