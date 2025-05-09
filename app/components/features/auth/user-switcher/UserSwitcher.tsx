'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dropdown, Avatar, Button, Flex, Popover, List, Badge, Spin, message } from 'antd';
import { ChevronDown, LogOut, UserPlus, UserX, MoreVertical, Users } from 'lucide-react';
import { signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import multiUserService, { ActiveUser } from '@/app/services/multi-user-service';
import { useAuth } from '@/app/contexts/auth';
import styles from './UserSwitcher.module.css';

// 导入进行刷新的事件分发工具
import { refreshFiles } from '@/app/utils/events/refresh-events';
import { triggerUserSwitch } from '@/app/utils/events/user-events';

interface UserSwitcherProps {
  currentUser: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) {
    return `${diffDay}天前`;
  } else if (diffHour > 0) {
    return `${diffHour}小时前`;
  } else if (diffMin > 0) {
    return `${diffMin}分钟前`;
  } else {
    return '刚刚';
  }
};

const UserSwitcher: React.FC<UserSwitcherProps> = ({ currentUser }) => {
  const [loggedUsers, setLoggedUsers] = useState<ActiveUser[]>([]);
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const { login, openLoginModal } = useAuth();

  // 获取所有已登录用户
  const loadUsers = useCallback(() => {
    const users = multiUserService.getUsers();
    setLoggedUsers(users);
  }, []);

  // 组件加载时获取用户列表
  useEffect(() => {
    loadUsers();
    // 如果当前有登录用户，确保将其添加到多用户服务中
    if (currentUser?.email) {
      multiUserService.updateUserActivity(currentUser.email);
    }
  }, [currentUser, loadUsers]);

  // 触发文件列表刷新
  const triggerFileListRefresh = useCallback(() => {
    // 触发文件列表刷新事件
    refreshFiles();
    
    // 主动刷新路由
    router.refresh();
    
    // 直接向window发送消息，通知文件列表刷新
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('user-switched', {
        detail: { timestamp: new Date().getTime() }
      }));
    }
  }, [router]);

  // 切换到指定用户
  const switchToUser = async (user: ActiveUser) => {
    try {
      setIsLoading(true);
      
      // 记录即将切换的用户信息到localStorage，用于确保主题能正确切换
      if (typeof window !== 'undefined' && user.email) {
        localStorage.setItem('switching_to_user', user.email);
      }
      
      // 使用已存储的用户信息登录
      const result = await signIn('credentials', {
        redirect: false,
        email: user.email,
        useStoredSession: true, // 告诉后端使用已存储的会话
      });
      
      // 检查登录结果
      if (result?.error) {
        console.error('切换用户失败:', result.error);
        message.error('切换用户失败: ' + result.error);
        setIsLoading(false);
        return;
      }
      
      // 通知系统用户已切换
      multiUserService.triggerUserSwitch(user);
      multiUserService.updateUserActivity(user.email as string);
      
      // 使用新的全局事件触发用户切换
      triggerUserSwitch(user.email as string);
      
      // 在这里主动请求用户主题设置
      try {
        const themeResponse = await fetch('/api/user/theme');
        if (themeResponse.ok) {
          const themeData = await themeResponse.json();
          if (themeData.success && themeData.theme) {
            // 立即应用主题
            document.documentElement.setAttribute('data-theme', themeData.theme);
            document.body.dataset.theme = themeData.theme;
            // 保存到localStorage
            localStorage.setItem('user-theme', themeData.theme);
            localStorage.setItem('app-theme-preference', themeData.theme);
          }
        }
      } catch (themeError) {
        console.error('获取用户主题失败:', themeError);
      }
      
      // 延迟关闭弹窗，等待刷新完成
      setTimeout(() => {
        setPopoverOpen(false);
        setIsLoading(false);
        
        // 清除切换标记
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            localStorage.removeItem('switching_to_user');
          }, 500);
        }
        
        // 显示切换成功消息
        message.success(`已切换到 ${user.name || user.email} 的账户`);
      }, 300);
    } catch (error) {
      console.error('切换用户失败:', error);
      setIsLoading(false);
      message.error('切换用户失败，请重试');
      
      // 清除切换标记
      if (typeof window !== 'undefined') {
        localStorage.removeItem('switching_to_user');
      }
    }
  };

  // 从已登录列表中移除用户
  const removeUser = async (event: React.MouseEvent, email: string) => {
    event.stopPropagation();
    multiUserService.removeUser(email);
    loadUsers();
  };

  // 退出当前用户
  const logoutCurrentUser = async () => {
    if (currentUser?.email) {
      setIsLoading(true);
      multiUserService.removeUser(currentUser.email);
      
      // 使用路由跳转到登出页面，而不是直接调用signOut
      router.push('/auth/logout');
      
      // 不需要设置isLoading为false，因为会重定向
    }
  };

  // 添加新用户
  const addNewUser = () => {
    openLoginModal();
    setPopoverOpen(false);
  };

  // 获取用户头像文字
  const getAvatarText = (name?: string | null, email?: string | null) => {
    return name?.[0]?.toUpperCase() || email?.[0]?.toUpperCase() || '?';
  };

  const content = (
    <div className={styles.userSwitcherPopover}>
      <div className={styles.userSwitcherHeader}>
        <h3>切换账户</h3>
        {isLoading && <Spin size="small" className={styles.switcherLoading} />}
      </div>
      <List
        itemLayout="horizontal"
        dataSource={loggedUsers}
        renderItem={(user) => {
          const isCurrentUser = user.email === currentUser?.email;
          
          return (
            <List.Item 
              className={`${styles.userItem} ${isCurrentUser ? styles.currentUser : ''}`}
              onClick={() => !isCurrentUser && !isLoading && switchToUser(user)}
            >
              <List.Item.Meta
                avatar={
                  <Badge dot={isCurrentUser} color="green">
                    <Avatar 
                      src={user.image} 
                      size="large"
                      className={styles.userAvatar}
                    >
                      {!user.image && getAvatarText(user.name, user.email)}
                    </Avatar>
                  </Badge>
                }
                title={
                  <div className={styles.userItemTitle}>
                    <span>{user.name || user.email}</span>
                    {isCurrentUser && <span className={styles.currentLabel}>当前</span>}
                  </div>
                }
                description={
                  <div className={styles.userItemDesc}>
                    <span>{user.email}</span>
                    <span className={styles.lastActive}>
                      {formatRelativeTime(user.lastActive)}
                    </span>
                  </div>
                }
              />
              {!isCurrentUser && (
                <Button
                  type="text"
                  icon={<UserX size={16} />}
                  className={styles.removeUserBtn}
                  onClick={(e) => removeUser(e, user.email as string)}
                  disabled={isLoading}
                />
              )}
            </List.Item>
          );
        }}
      />
      <div className={styles.userSwitcherFooter}>
        <Button 
          type="default" 
          icon={<UserPlus size={16} />}
          onClick={addNewUser}
          className={styles.addAccountBtn}
          disabled={isLoading}
        >
          添加账户
        </Button>
        <Button 
          type="primary" 
          danger
          icon={<LogOut size={16} />}
          onClick={logoutCurrentUser}
          className={styles.logoutBtn}
          disabled={isLoading}
        >
          退出当前账户
        </Button>
      </div>
    </div>
  );

  // 如果没有当前用户，显示登录按钮
  if (!currentUser) {
    return (
      <Button 
        type="text"
        className={styles.miniSidebarButton}
        onClick={openLoginModal}
        icon={<Users size={20} className={styles.iconStyle} />}
      />
    );
  }

  return (
    <Popover
      content={content}
      trigger="click"
      open={popoverOpen}
      onOpenChange={setPopoverOpen}
      placement="right"
      overlayClassName={styles.userSwitcherOverlay}
    >
      <Button 
        type="text"
        className={styles.miniSidebarButton}
        icon={<Users size={20} className={styles.iconStyle} />}
        loading={isLoading}
      />
    </Popover>
  );
};

export default UserSwitcher; 