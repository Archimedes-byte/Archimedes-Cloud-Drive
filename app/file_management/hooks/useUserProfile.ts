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

    // 添加更详细的 session 检查日志
    console.log('获取用户资料检查 session 状态:', { 
      sessionExists: !!session, 
      hasUser: !!session?.user, 
      userEmail: session?.user?.email || 'unknown',
      retryCount 
    });

    if (!session || !session.user) {
      console.log('未检测到有效会话，无法获取用户资料');
      setIsLoading(false);
      setError('未检测到有效会话');
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

    // 如果已经有用户资料且不是重试模式，则直接返回现有资料
    if (userProfile && !showToast && retryCount === 0) {
      console.log('已有用户资料，直接返回:', userProfile.email);
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
      
      // 添加更详细的响应日志
      console.log('资料请求响应状态:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
      
      if (!response.ok) {
        console.error(`资料请求失败, 状态码: ${response.status}`);
        throw new Error(`服务器响应错误: ${response.status} ${response.statusText}`);
      }
      
      const data: UserProfileResponse = await response.json();
      
      console.log('资料请求返回数据:', {
        success: data.success,
        hasProfile: !!data.profile,
        error: data.error || '无'
      });
      
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
      
      // 详细记录错误信息
      console.error('获取用户资料发生错误:', {
        errorType: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : String(err),
        isAbort: err instanceof DOMException && err.name === 'AbortError'
      });
      
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
            }, 1500);
          }
          
          return tempProfile;
        }
        setIsLoading(false);
        return userProfile;
      }
      
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      console.error('获取用户资料失败:', errorMessage);
      
      // 增加连续错误计数
      const newErrorCount = consecutiveErrors + 1;
      setConsecutiveErrors(newErrorCount);
      
      // 如果连续错误次数超过阈值，切换到离线模式
      if (newErrorCount >= MAX_ERROR_COUNT) {
        console.log(`连续错误次数(${newErrorCount})已超过阈值(${MAX_ERROR_COUNT})，切换到离线模式`);
        setIsOfflineMode(true);
        // 使用session信息创建离线配置
        const offlineProfile = {
          ...DEFAULT_OFFLINE_PROFILE,
          email: session.user?.email || DEFAULT_OFFLINE_PROFILE.email,
          name: session.user?.name || DEFAULT_OFFLINE_PROFILE.name,
        };
        setUserProfile(offlineProfile);
        setIsLoading(false);
        setError('网络连接问题，已切换到离线模式');
        return offlineProfile;
      }
      
      // 更新错误状态
      setError(errorMessage);
      
      // 如果未达到最大重试次数，则重试
      if (retryCount < MAX_RETRIES) {
        console.log(`将在 ${RETRY_DELAY}ms 后第 ${retryCount + 1} 次重试获取用户资料`);
        setTimeout(() => {
          fetchUserProfile(false, retryCount + 1);
        }, RETRY_DELAY);
      } else {
        // 达到最大重试次数，停止加载状态
        setIsLoading(false);
        
        // 如果此时没有用户资料，创建一个离线资料以保证UI可用
        if (!userProfile && session) {
          console.log('重试失败且没有用户资料，创建离线资料');
          const offlineProfile = {
            ...DEFAULT_OFFLINE_PROFILE,
            email: session.user?.email || DEFAULT_OFFLINE_PROFILE.email,
            name: session.user?.name || DEFAULT_OFFLINE_PROFILE.name,
          };
          setUserProfile(offlineProfile);
          return offlineProfile;
        }
      }
      
      return userProfile;
    }
  };

  // 强制刷新用户资料
  const forceRefreshProfile = () => {
    // 确保重置isLoading状态，使UI显示正在加载
    setIsLoading(true);
    fetchUserProfile(true, 0);
  };

  // 更新用户资料
  const updateUserProfile = async (profileData: UserProfileInput) => {
    if (!session) {
      console.log('未检测到会话，无法更新用户资料');
      return { success: false, error: '未登录' };
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `服务器响应错误: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '更新用户资料失败');
      }

      // 更新本地用户资料
      if (userProfile && data.profile) {
        const updatedProfile = {
          ...userProfile,
          ...data.profile,
        };
        setUserProfile(updatedProfile);
      }

      // 如果更新了主题，应用它
      if (profileData.theme && data.profile?.theme) {
        applyTheme(data.profile.theme);
      }

      setIsLoading(false);
      toast.success('用户资料已更新');
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : '更新用户资料失败';
      console.error('更新用户资料错误:', errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // 专门用于更新主题的方法
  const updateTheme = async (theme: string) => {
    try {
      // 先本地应用主题变更，优化用户体验
      applyTheme(theme);
      
      // 然后发送请求保存主题设置
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme }),
      });

      if (!response.ok) {
        throw new Error(`服务器响应错误: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '更新主题失败');
      }

      // 更新本地用户资料中的主题设置
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          theme
        });
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新主题失败';
      console.error('更新主题错误:', errorMessage);
      // 不显示错误通知，因为主题已应用，即使保存失败也不影响当前体验
      return { success: false, error: errorMessage };
    }
  };

  // 应用主题
  const applyTheme = (theme: string = 'default') => {
    try {
      if (!theme || theme === 'default' || theme === 'system') {
        console.log(`应用系统默认主题`);
        applyThemeService('system');
      } else {
        console.log(`应用主题: ${theme}`);
        applyThemeService(theme);
      }
    } catch (error) {
      console.error('应用主题时出错:', error);
    }
  };

  // 组件挂载和session变化时获取用户资料
  useEffect(() => {
    // 清除任何现有的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // 详细记录 session 状态
    console.log('会话状态变化:', { 
      sessionExists: !!session, 
      hasUser: !!session?.user, 
      userEmail: session?.user?.email || 'unknown' 
    });
    
    // 仅当会话存在且有用户信息时获取用户资料
    if (session?.user) {
      console.log('会话变化，准备获取用户资料...');
      
      // 添加短暂延迟，确保 session 完全稳定
      const timer = setTimeout(() => {
        console.log('开始获取用户资料...');
        fetchUserProfile();
      }, 300);
      
      return () => {
        clearTimeout(timer);
      };
    } else if (session === null) {
      // 会话已确定不存在，设置为未登录状态
      console.log('会话已确定不存在，设置为未登录状态');
      setIsLoading(false);
      setUserProfile(null);
      setError('未登录');
    } else {
      // session 状态不确定，等待更新
      console.log('会话状态不确定，等待更新...');
    }
    
    // 组件卸载时中止任何挂起的请求
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [session]);

  // 初始化时应用用户的主题设置
  useEffect(() => {
    if (userProfile?.theme) {
      applyTheme(userProfile.theme);
    }
  }, [userProfile?.theme]);

  return {
    userProfile,
    isLoading,
    error,
    isOfflineMode,
    effectiveAvatarUrl,
    fetchUserProfile,
    forceRefreshProfile,
    updateUserProfile,
    updateTheme,
    applyTheme
  };
}; 