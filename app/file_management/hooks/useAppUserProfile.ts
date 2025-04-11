import { useCallback, useEffect } from 'react';
import { useAppState } from '../context/AppStateContext';
import { api } from '@/app/lib/api/client';
import { useSession } from 'next-auth/react';

/**
 * 用户资料Hook - 基于全局状态管理
 * 负责处理用户资料相关操作
 */
export const useAppUserProfile = () => {
  const { state, dispatch } = useAppState();
  const { profile, isLoading, error } = state.user;
  const { data: session } = useSession();
  
  /**
   * 设置用户资料
   */
  const setUserProfile = useCallback((profile: any) => {
    dispatch({ type: 'SET_USER_PROFILE', payload: profile });
  }, [dispatch]);
  
  /**
   * 设置加载状态
   */
  const setIsLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_USER_LOADING', payload: loading });
  }, [dispatch]);
  
  /**
   * 设置错误信息
   */
  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_USER_ERROR', payload: error });
  }, [dispatch]);
  
  /**
   * 获取用户资料
   */
  const fetchUserProfile = useCallback(async (forceRefresh = false) => {
    // 如果已经加载过用户资料且不强制刷新，则直接返回
    if (profile && !forceRefresh) return profile;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const userProfile = await api.get('/api/user/profile');
      setUserProfile(userProfile);
      return userProfile;
    } catch (error) {
      console.error('获取用户资料失败:', error);
      setError(error instanceof Error ? error.message : '获取用户资料失败');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [profile, setError, setIsLoading, setUserProfile]);
  
  /**
   * 强制刷新用户资料
   */
  const forceRefreshProfile = useCallback(() => {
    return fetchUserProfile(true);
  }, [fetchUserProfile]);
  
  /**
   * 更新用户资料
   */
  const updateUserProfile = useCallback(async (profileData: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedProfile = await api.patch('/api/user/profile', profileData);
      setUserProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('更新用户资料失败:', error);
      setError(error instanceof Error ? error.message : '更新用户资料失败');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setError, setIsLoading, setUserProfile]);
  
  /**
   * 获取有效的头像URL
   */
  const getEffectiveAvatarUrl = useCallback(() => {
    // 优先使用用户资料中的头像
    if (profile?.avatarUrl) {
      return profile.avatarUrl;
    }
    
    // 然后使用会话中的头像
    if (session?.user?.image) {
      return session.user.image;
    }
    
    // 最后使用默认头像
    return '/images/default-avatar.png';
  }, [profile, session]);
  
  // 在组件挂载时获取用户资料
  useEffect(() => {
    if (session?.user?.email && !profile && !isLoading) {
      fetchUserProfile();
    }
  }, [session, profile, isLoading, fetchUserProfile]);
  
  return {
    userProfile: profile,
    isLoading,
    error,
    fetchUserProfile,
    forceRefreshProfile,
    updateUserProfile,
    effectiveAvatarUrl: getEffectiveAvatarUrl()
  };
}; 