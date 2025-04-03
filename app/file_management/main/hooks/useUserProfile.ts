import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { UserProfile } from '../../types/index';

export const useUserProfile = () => {
  const { data: session, status } = useSession();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(0); // 用于强制刷新的状态

  // 获取用户资料的函数
  const fetchUserProfile = useCallback(async () => {
    // 如果未登录，不执行请求
    if (status !== 'authenticated' || !session?.user?.email) {
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('正在获取用户资料...');
      const response = await fetch('/api/user/profile');
      const data = await response.json();
      
      if (data.success && data.profile) {
        console.log('成功获取用户资料:', data.profile);
        setUserProfile(data.profile);
      } else {
        console.warn('获取用户资料失败或无资料数据');
      }
    } catch (error) {
      console.error('获取用户资料失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session, status]);

  // 强制刷新用户资料
  const refreshUserProfile = useCallback(() => {
    console.log('强制刷新用户资料');
    setUserProfile(null); // 清除当前资料
    setLastRefresh(Date.now()); // 更新刷新时间戳，触发重新获取
  }, []);

  // 获取用户资料信息，包括自定义头像和主题
  useEffect(() => {
    // 当未加载资料且非加载状态时获取
    if (!userProfile && !isLoading && status === 'authenticated') {
      fetchUserProfile();
    }
  }, [session, status, userProfile, isLoading, fetchUserProfile, lastRefresh]);
  
  // 确定显示哪个头像
  const effectiveAvatarUrl = userProfile?.avatarUrl || session?.user?.image;

  return {
    userProfile,
    effectiveAvatarUrl,
    session,
    status,
    isLoading,
    refreshUserProfile
  };
}; 