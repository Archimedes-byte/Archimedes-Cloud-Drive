'use client';

import React, { useCallback } from 'react';
import { Layout, Avatar, Button, Tooltip, Divider, theme } from 'antd';
import { 
  HomeOutlined, LogoutOutlined, BgColorsOutlined, 
  UserOutlined 
} from '@ant-design/icons';
import styles from './mini-sidebar.module.css';

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

  // 获取用户首字母作为头像显示
  const getAvatarText = useCallback(() => {
    if (userName && userName.length > 0) {
      return userName[0].toUpperCase();
    }
    if (userEmail && userEmail.length > 0) {
      return userEmail[0].toUpperCase();
    }
    return '?';
  }, [userName, userEmail]);

  // 计算渐变背景 - 使用主题颜色
  const gradientBackground = `linear-gradient(to bottom, ${token.colorPrimary}, ${token.colorPrimaryActive})`;

  return (
    <Sider
      width={72}
      style={{ background: gradientBackground, position: 'fixed', left: 0, boxShadow: token.boxShadowSecondary }}
      className={styles.miniSidebar}
    >
      <div className={styles.avatarContainer}>
        <Tooltip title={userName || userEmail || '用户信息'} placement="right">
          <Button 
            type="text" 
            shape="circle" 
            onClick={onAvatarClick}
            style={{ padding: 0 }}
          >
            {avatarUrl ? (
              <Avatar 
                src={avatarUrl} 
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