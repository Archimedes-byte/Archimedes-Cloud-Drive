import React, { useCallback, useMemo } from 'react';
import { Layout, Avatar, Button, Tooltip, Divider, theme } from 'antd';
import { 
  HomeOutlined, LogoutOutlined, BgColorsOutlined, 
  UserOutlined 
} from '@ant-design/icons';

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
  const gradientBackground = useMemo(() => 
    `linear-gradient(to bottom, ${token.colorPrimary}, ${token.colorPrimaryActive})`,
  [token]);

  // 侧边栏容器样式
  const siderStyle = useMemo(() => ({
    background: gradientBackground,
    height: '100vh',
    position: 'fixed' as const,
    left: 0,
    zIndex: 10,
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    padding: '20px 0',
    boxShadow: token.boxShadowSecondary
  }), [gradientBackground, token.boxShadowSecondary]);

  // 分隔线样式
  const dividerStyle = useMemo(() => ({ 
    borderTop: '1px solid rgba(255, 255, 255, 0.2)', 
    width: '40px', 
    minWidth: '40px',
    margin: '4px 0 16px' 
  }), []);

  // 按钮容器样式
  const buttonContainerStyle = useMemo(() => ({ 
    display: 'flex' as const, 
    flexDirection: 'column' as const, 
    alignItems: 'center' as const,
    gap: '16px'
  }), []);

  // 按钮基础样式
  const buttonBaseStyle = useMemo(() => ({ 
    background: 'transparent', 
    border: 'none',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    height: '40px',
    width: '40px',
    transition: 'all 0.3s'
  }), []);

  // 图标样式
  const iconStyle = useMemo(() => ({
    color: 'white', 
    fontSize: '20px'
  }), []);

  // 头像样式
  const avatarStyle = useMemo(() => ({ 
    cursor: 'pointer',
    border: '2px solid rgba(255, 255, 255, 0.5)',
    transition: 'all 0.3s'
  }), []);

  // 默认头像样式
  const defaultAvatarStyle = useMemo(() => ({ 
    background: 'rgba(255, 255, 255, 0.2)', 
    color: '#fff',
    cursor: 'pointer',
    border: '2px solid rgba(255, 255, 255, 0.5)',
    transition: 'all 0.3s'
  }), []);

  return (
    <Sider
      width={72}
      style={siderStyle}
      className="custom-mini-sidebar"
    >
      <div style={{ position: 'relative', marginBottom: '20px' }}>
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
                style={avatarStyle}
              />
            ) : (
              <Avatar 
                size={38} 
                style={defaultAvatarStyle}
              >
                {getAvatarText()}
              </Avatar>
            )}
          </Button>
        </Tooltip>
      </div>

      <Divider style={dividerStyle} />

      <div style={buttonContainerStyle}>
        <Tooltip title="主页" placement="right">
          <Button 
            type="text" 
            shape="circle" 
            icon={<HomeOutlined style={iconStyle} />} 
            onClick={onHomeClick}
            style={buttonBaseStyle}
            className="mini-sidebar-button"
          />
        </Tooltip>
        
        <Tooltip title="主题设置" placement="right">
          <Button 
            type="text" 
            shape="circle" 
            icon={<BgColorsOutlined style={iconStyle} />} 
            onClick={onThemeClick}
            style={buttonBaseStyle}
            className="mini-sidebar-button"
          />
        </Tooltip>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <Tooltip title="退出登录" placement="right">
          <Button 
            type="text" 
            shape="circle" 
            icon={<LogoutOutlined style={iconStyle} />} 
            onClick={onLogoutClick}
            style={buttonBaseStyle}
            className="mini-sidebar-button"
          />
        </Tooltip>
      </div>
    </Sider>
  );
});

export default AntMiniSidebar; 