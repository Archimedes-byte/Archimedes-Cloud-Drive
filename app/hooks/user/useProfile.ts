import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { toast } from 'sonner'
import { applyTheme as applyThemeService } from '@/app/theme';
import { UserProfile } from '@/app/types';
import { apiClient } from '@/app/services/api/client';

// 默认离线用户配置，当API不可用时使用
const DEFAULT_OFFLINE_PROFILE: UserProfile = {
  id: 'offline-user',
  email: 'offline@example.com',
  name: '离线模式',
  avatarUrl: null,
  theme: 'default',
  storageUsed: 0,
  storageLimit: 1024 * 1024 * 100, // 100MB
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

/**
 * 用户资料Hook
 * 提供用户资料的获取、更新和管理功能
 * 
 * @returns 用户资料和相关操作方法
 */
export function useProfile() {
  const { data: session } = useSession()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOfflineMode, setIsOfflineMode] = useState(false)

  // 有效的头像URL，优先使用用户资料中的，其次是会话中的
  const effectiveAvatarUrl = userProfile?.avatarUrl || (session?.user as any)?.image || null

  /**
   * 获取用户资料
   * @param showToast 是否显示加载成功的提示
   * @param forceLoad 是否强制重新加载数据
   * @param skipLoadingState 是否跳过加载状态设置(用于提高UI响应速度)
   * @returns 用户资料
   */
  const fetchUserProfile = useCallback(async (
    showToast = false, 
    forceLoad = false,
    skipLoadingState = false
  ) => {
    // 如果没有session，则不进行请求
    if (!session || !session.user || !session.user.email) {
      !skipLoadingState && setIsLoading(false);
      setError('未检测到有效会话或用户信息');
      return null;
    }

    // 如果已处于离线模式，使用离线资料
    if (isOfflineMode) {
      const offlineProfile = {
        ...DEFAULT_OFFLINE_PROFILE,
        email: session.user?.email || DEFAULT_OFFLINE_PROFILE.email,
        name: session.user?.name || DEFAULT_OFFLINE_PROFILE.name,
      };
      setUserProfile(offlineProfile);
      !skipLoadingState && setIsLoading(false);
      return offlineProfile;
    }

    // 如果已经有数据并且不是强制加载，则直接返回缓存数据
    if (userProfile && !forceLoad) {
      return userProfile;
    }

    // 开始加载
    !skipLoadingState && setIsLoading(true);
    setError(null);
    
    try {
      // 使用API客户端获取资料
      const profile = await apiClient.getUserProfile();
      setUserProfile(profile);
      
      if (showToast) {
        toast.success('用户资料已更新');
      }
      
      // 应用用户主题
      if (profile.theme) {
        applyThemeService(profile.theme);
      }
      
      return profile;
    } catch (err) {
      console.error('获取用户资料失败:', err);
      setError(err instanceof Error ? err.message : '无法加载用户资料');
      
      // 进入离线模式
      setIsOfflineMode(true);
      const offlineProfile = {
        ...DEFAULT_OFFLINE_PROFILE,
        email: session.user?.email || DEFAULT_OFFLINE_PROFILE.email,
        name: session.user?.name || DEFAULT_OFFLINE_PROFILE.name,
      };
      setUserProfile(offlineProfile);
      
      return offlineProfile;
    } finally {
      !skipLoadingState && setIsLoading(false);
    }
  }, [session, isOfflineMode, userProfile])

  /**
   * 强制刷新用户资料
   * @returns 刷新后的用户资料
   */
  const forceRefreshProfile = useCallback(() => {
    return fetchUserProfile(true, true);
  }, [fetchUserProfile]);

  /**
   * 后台刷新用户资料(不更新loading状态，不阻塞UI)
   * @returns 刷新后的用户资料 
   */
  const backgroundRefreshProfile = useCallback(() => {
    return fetchUserProfile(false, true, true);
  }, [fetchUserProfile]);

  /**
   * 更新用户资料
   * @param data 要更新的资料
   * @returns 更新后的资料
   */
  const updateUserProfile = useCallback(async (data: any) => {
    if (!session || !session.user) {
      throw new Error('未登录，无法更新资料')
    }
    
    if (isOfflineMode) {
      toast.error('离线模式下无法更新资料')
      return false
    }
    
    try {
      // 使用API客户端更新资料
      const updatedProfile = await apiClient.updateUserProfile(data)
      setUserProfile(updatedProfile)
      
      // 如果更新了主题，应用新主题
      if (data.theme && data.theme !== userProfile?.theme) {
        applyThemeService(data.theme)
      }
      
      toast.success('资料更新成功')
      return true
    } catch (err) {
      console.error('更新用户资料失败:', err)
      toast.error(err instanceof Error ? err.message : '更新资料失败')
      return false
    }
  }, [session, userProfile, isOfflineMode])

  // 初始化时加载用户资料
  useEffect(() => {
    if (session) {
      fetchUserProfile()
    }
  }, [session, fetchUserProfile])

  // 返回状态和方法
  return {
    userProfile,
    isLoading,
    error,
    isOfflineMode,
    effectiveAvatarUrl,
    fetchUserProfile,
    forceRefreshProfile,
    backgroundRefreshProfile,
    updateUserProfile
  }
} 