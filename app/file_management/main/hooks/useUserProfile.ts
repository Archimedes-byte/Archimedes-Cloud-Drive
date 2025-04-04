import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
// 导入主题服务
import { applyTheme as applyThemeService } from '@/app/shared/themes';

// 定义返回的用户资料接口
interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl?: string | null;
  theme?: string | null;
  storageUsed: number;
  storageLimit: number;
  createdAt: string;
  updatedAt: string;
}

// 用户资料更新输入
interface UserProfileInput {
  displayName?: string;
  avatarUrl?: string;
  theme?: string;
}

// 用户资料 API 响应
interface UserProfileResponse {
  success: boolean;
  profile?: UserProfile;
  error?: string;
}

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
};

// 重试配置
const RETRY_DELAY = 3000; // 3秒
const MAX_RETRIES = 2; // 最大重试次数
const MAX_ERROR_COUNT = 3; // 连续错误阈值，超过后进入离线模式

export const useUserProfile = () => {
  const { data: session } = useSession();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  // 有效的头像URL，优先使用用户资料中的，其次是会话中的
  const effectiveAvatarUrl = userProfile?.avatarUrl || session?.user?.image || null;

  // 获取用户资料
  const fetchUserProfile = async (showToast = false, retryCount = 0) => {
    // 判断是否在短时间内重复调用，避免频繁请求
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    
    if (retryCount === 0 && timeSinceLastFetch < 2000 && lastFetchTimeRef.current > 0) {
      console.log(`距上次请求仅 ${timeSinceLastFetch}ms，跳过此次请求`);
      return userProfile;
    }
    
    lastFetchTimeRef.current = now;

    if (!session) {
      console.log('未检测到会话，无法获取用户资料');
      setIsLoading(false);
      setError('未登录');
      return null;
    }

    // 如果已经超过最大错误数，并且已经进入离线模式，则使用离线配置
    if (isOfflineMode && retryCount === 0) {
      console.log('应用正在离线模式下运行，使用默认配置');
      if (!userProfile) {
        const offlineProfile = {
          ...DEFAULT_OFFLINE_PROFILE,
          email: session.user?.email || DEFAULT_OFFLINE_PROFILE.email,
          name: session.user?.name || DEFAULT_OFFLINE_PROFILE.name,
        };
        setUserProfile(offlineProfile);
        setIsLoading(false);
        return offlineProfile;
      }
      setIsLoading(false);
      return userProfile;
    }

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // 创建新的AbortController
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      setIsLoading(true);
      
      if (retryCount === 0) {
        setError(null);
      }
      
      console.log(`获取用户资料${retryCount > 0 ? `(重试 ${retryCount}/${MAX_RETRIES})` : ''}...`);
      
      // 设置请求超时 - 从5秒增加到10秒，增强容错性
      timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          console.log('用户资料请求超时，中止请求');
          abortControllerRef.current.abort();
        }
      }, 10000); // 10秒超时
      
      const response = await fetch('/api/user/profile', {
        signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (timeoutId) clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`资料请求失败, 状态码: ${response.status}`);
        throw new Error(`服务器响应错误: ${response.status} ${response.statusText}`);
      }
      
      const data: UserProfileResponse = await response.json();
      
      if (!data.success) {
        console.error('资料请求返回失败状态:', data.error);
        throw new Error(data.error || '获取用户资料失败');
      }
      
      if (!data.profile) {
        console.error('资料请求未返回用户数据');
        throw new Error('服务器未返回用户资料数据');
      }
      
      // 请求成功，重置连续错误计数
      setConsecutiveErrors(0);
      setIsOfflineMode(false);
      setUserProfile(data.profile);
      // 明确设置加载状态为完成
      setIsLoading(false);
      console.log('用户资料获取成功:', data.profile.email);
      
      if (showToast) {
        toast.success('用户资料已更新');
      }
      
      return data.profile;
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      
      // 如果是因为我们主动取消请求，则不处理错误
      if (err instanceof DOMException && err.name === 'AbortError') {
        console.log('用户资料请求被取消');
        
        // 修改：请求被取消时，如果当前没有用户资料，则返回临时资料而不是null
        if (!userProfile && session) {
          console.log('请求被取消但没有用户资料，创建临时资料');
          const tempProfile = {
            ...DEFAULT_OFFLINE_PROFILE,
            email: session.user?.email || DEFAULT_OFFLINE_PROFILE.email,
            name: session.user?.name || DEFAULT_OFFLINE_PROFILE.name,
            id: 'temp-' + Date.now(),
          };
          
          // 设置临时资料并更新加载状态为完成
          setUserProfile(tempProfile);
          
          // 修改：即使创建了临时资料，也应该设置加载状态为false
          // 因为已经有临时资料可以使用了，不应该一直显示加载中
          setIsLoading(false);
          console.log('已设置临时资料并更新加载状态为完成:', tempProfile.id);
          
          // 如果不是重试，则自动在短暂延迟后尝试重新获取
          if (retryCount === 0) {
            setTimeout(() => {
              console.log('自动重新尝试获取用户资料...');
              // 重新获取前再次设置加载状态为true
              setIsLoading(true);
              fetchUserProfile(false, 1);
            }, 500);
          }
          
          return tempProfile;
        }
        
        return userProfile; // 返回当前资料，而不是null
      }
      
      // 其他网络错误处理
      console.error('获取用户资料失败:', err);
      
      // 记录连续错误次数
      const newErrorCount = consecutiveErrors + 1;
      setConsecutiveErrors(newErrorCount);
      
      // 确定是否进入离线模式
      if (newErrorCount >= MAX_ERROR_COUNT) {
        console.log(`连续 ${MAX_ERROR_COUNT} 次错误，进入离线模式`);
        setIsOfflineMode(true);
        
        // 使用默认离线配置 - 但如果已有用户资料，优先使用已有资料
        const offlineProfile = userProfile || {
          ...DEFAULT_OFFLINE_PROFILE,
          email: session.user?.email || DEFAULT_OFFLINE_PROFILE.email,
          name: session.user?.name || DEFAULT_OFFLINE_PROFILE.name,
        };
        
        if (!userProfile) {
          setUserProfile(offlineProfile);
        }
        
        const offlineMessage = '网络连接问题，已切换到离线模式';
        setError(offlineMessage);
        
        if (showToast) {
          toast.error(offlineMessage);
        }
        
        return offlineProfile;
      } else {
        // 错误信息处理
        let errorMessage: string;
        
        if (err instanceof TypeError && err.message === 'Failed to fetch') {
          errorMessage = '连接服务器失败，请检查网络连接';
        } else {
          errorMessage = err instanceof Error ? err.message : '获取用户资料失败';
        }
        
        setError(errorMessage);
        
        if (showToast) {
          toast.error(errorMessage);
        }
        
        // 增加重试次数和延长重试间隔
        if (retryCount < MAX_RETRIES) {
          // 退避算法：重试时间随重试次数增加而延长
          const retryDelay = RETRY_DELAY * Math.pow(1.5, retryCount);
          console.log(`将在 ${retryDelay}ms 后重试...`);
          
          setTimeout(() => {
            fetchUserProfile(showToast, retryCount + 1);
          }, retryDelay);
        }
      }
      
      // 如果已经有用户资料，即使出错也返回现有资料
      return userProfile || null;
    } finally {
      if (retryCount === 0 || retryCount >= MAX_RETRIES) {
        setIsLoading(false);
      }
    }
  };

  // 强制刷新用户资料
  const forceRefreshProfile = () => {
    if (isOfflineMode) {
      // 如果处于离线模式，尝试重新连接
      setIsOfflineMode(false);
      setConsecutiveErrors(0);
    }
    return fetchUserProfile(true);
  };

  // 更新用户资料
  const updateUserProfile = async (profileData: UserProfileInput) => {
    if (!session) {
      toast.error('未登录');
      return null;
    }

    // 如果处于离线模式，更新本地配置并提示
    if (isOfflineMode) {
      const updatedProfile = {
        ...userProfile,
        ...profileData,
        updatedAt: new Date().toISOString()
      };
      setUserProfile(updatedProfile as UserProfile);
      toast.info('离线模式：配置已在本地更新，但未同步到服务器');
      return updatedProfile;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      const data: UserProfileResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '更新用户资料失败');
      }
      
      setUserProfile(data.profile || null);
      setConsecutiveErrors(0); // 重置错误计数
      toast.success('用户资料已更新');
      return data.profile;
    } catch (err) {
      console.error('更新用户资料失败:', err);
      
      // 如果更新失败但我们有用户资料，则尝试本地更新
      if (userProfile) {
        const updatedProfile = {
          ...userProfile,
          ...profileData,
          updatedAt: new Date().toISOString()
        };
        setUserProfile(updatedProfile as UserProfile);
        toast.info('服务器更新失败，但配置已在本地更新');
        return updatedProfile;
      }
      
      const errorMessage = err instanceof Error ? err.message : '更新用户资料失败';
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // 更新用户主题
  const updateTheme = async (theme: string) => {
    if (!session) {
      toast.error('未登录');
      return false;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/user/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ theme })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '更新主题失败');
      }
      
      if (data.success) {
        // 更新本地用户资料
        if (userProfile) {
          setUserProfile({
            ...userProfile,
            theme: theme
          });
        }
        
        // 应用主题到文档
        applyTheme(theme);
        
        toast.success('主题已更新');
        return true;
      } else {
        throw new Error('更新主题失败');
      }
    } catch (err) {
      console.error('更新主题失败:', err);
      
      // 如果服务器更新失败，但想要在本地应用主题
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          theme: theme
        });
        
        // 仍然在本地应用主题，但告知用户同步失败
        applyTheme(theme);
        toast.warning('主题已在本地应用，但服务器同步失败');
        return true;
      }
      
      toast.error(err instanceof Error ? err.message : '无法更新主题');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 应用主题到文档
  const applyTheme = (theme: string = 'default') => {
    // 使用统一的主题服务
    applyThemeService(theme);
    console.log(`已应用主题: ${theme}`);
  };

  // 清理资源
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    userProfile,
    isLoading,
    error,
    isOfflineMode,
    fetchUserProfile,
    forceRefreshProfile,
    updateUserProfile,
    updateTheme,
    applyTheme,
    effectiveAvatarUrl
  };
}; 