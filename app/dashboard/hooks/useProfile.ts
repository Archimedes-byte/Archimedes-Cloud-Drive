import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface UserInfo {
  displayName: string;
  bio: string;
  location: string;
  website: string;
  company: string;
  avatarUrl?: string | null; // 自定义头像URL
  theme?: string | null;     // 用户主题偏好
  createdAt?: string;        // 账户创建时间
}

export const useProfile = () => {
  const { data: session, status } = useSession();
  
  // 初始化userInfo状态
  const [userInfo, setUserInfo] = useState<UserInfo>({
    displayName: '',
    bio: '',
    location: '',
    website: '',
    company: '',
    avatarUrl: null,
    theme: null,
    createdAt: undefined
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 从API获取用户资料
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (status !== 'authenticated' || !session?.user) {
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/user/profile');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || '获取用户资料失败');
        }
        
        if (data.success && data.profile) {
          console.log('成功获取到用户资料:', data.profile);
          setUserInfo({
            displayName: data.profile.displayName || session.user.name || '',
            bio: data.profile.bio || '',
            location: data.profile.location || '',
            website: data.profile.website || '',
            company: data.profile.company || '',
            avatarUrl: data.profile.avatarUrl || null,
            theme: data.profile.theme || null,
            createdAt: data.profile.createdAt
          });
        } else {
          console.warn('API返回成功但没有资料数据，使用默认值');
          // 使用默认数据
          setUserInfo({
            displayName: session.user.name || '',
            bio: '',
            location: '',
            website: '',
            company: '',
            avatarUrl: null,
            theme: null,
            createdAt: undefined
          });
        }
      } catch (err) {
        console.error('获取用户资料时出错:', err);
        setError(err instanceof Error ? err.message : '无法加载用户资料');
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchUserProfile();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [session, status]);

  // 更新用户资料
  const updateProfile = async (updatedInfo: UserInfo) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedInfo)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '更新用户资料失败');
      }
      
      if (data.success && data.profile) {
        console.log('成功更新用户资料:', data.profile);
        setUserInfo({
          displayName: data.profile.displayName || '',
          bio: data.profile.bio || '',
          location: data.profile.location || '',
          website: data.profile.website || '',
          company: data.profile.company || '',
          avatarUrl: data.profile.avatarUrl || null,
          theme: data.profile.theme || null,
          createdAt: data.profile.createdAt
        });
        return true;
      } else {
        throw new Error('更新资料失败');
      }
    } catch (err) {
      console.error('更新用户资料时出错:', err);
      setError(err instanceof Error ? err.message : '无法更新用户资料');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 更新用户主题
  const updateTheme = async (theme: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
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
        console.log('成功更新用户主题:', data.theme);
        setUserInfo(prev => ({
          ...prev,
          theme: data.theme
        }));
        return true;
      } else {
        throw new Error('更新主题失败');
      }
    } catch (err) {
      console.error('更新用户主题时出错:', err);
      setError(err instanceof Error ? err.message : '无法更新用户主题');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { userInfo, setUserInfo, isLoading, error, updateProfile, updateTheme };
}; 