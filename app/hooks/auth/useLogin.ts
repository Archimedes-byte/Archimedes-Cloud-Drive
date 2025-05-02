'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export interface LoginCredentials {
  email: string;
  password: string;
}

export const useLogin = () => {
  const router = useRouter();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 表单字段更新处理
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof LoginCredentials) => {
    setCredentials(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  // 电子邮件登录
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
        callbackUrl: '/pages/file'
      });

      if (result?.error) {
        setError(result.error);
        setSuccess('');
      } else if (result?.ok) {
        // 登录成功，为用户设置唯一标识符，用于主题隔离
        // 使用邮箱的哈希作为用户唯一标识
        const userId = btoa(credentials.email).replace(/[^a-zA-Z0-9]/g, '');
        localStorage.setItem('user-id', userId);
        
        setSuccess('登录成功，正在跳转...');
        setTimeout(() => {
          router.push('/pages/file');
        }, 1000);
      }
    } catch (error) {
      setError('登录失败，请重试');
      setSuccess('');
    } finally {
      setIsLoading(false);
    }
  };

  // GitHub登录
  const handleGitHubLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const result = await signIn('github', {
        redirect: false,
        callbackUrl: '/pages/file'
      });

      if (result?.error) {
        setError('GitHub 登录失败：' + result.error);
      } else if (result?.ok) {
        setSuccess('登录成功，正在跳转...');
        setTimeout(() => {
          router.push('/pages/file');
        }, 1000);
      }
    } catch (error) {
      setError(typeof error === 'string' ? error : 'GitHub 登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // Google登录回调
  const handleGoogleLogin = async (response: any) => {
    try {
      setIsLoading(true);
      setError('');
      
      const result = await signIn('google', {
        credential: response.credential,
        redirect: false,
        callbackUrl: '/pages/file'
      });

      if (result?.error) {
        setError('Google登录失败：' + result.error);
      } else if (result?.ok) {
        // 尝试从JWT中解码用户信息
        try {
          const base64Url = response.credential.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(base64));
          
          // 使用邮箱生成唯一标识符
          if (payload.email) {
            const userId = btoa(payload.email).replace(/[^a-zA-Z0-9]/g, '');
            localStorage.setItem('user-id', userId);
            console.log('已设置Google用户的唯一标识符');
          }
        } catch (e) {
          console.error('无法从Google凭证解析用户ID:', e);
          // 使用随机ID作为备选方案
          localStorage.setItem('user-id', `google_${Date.now()}`);
        }
        
        setSuccess('登录成功，正在跳转...');
        // 使用 window.location 进行硬跳转
        window.location.href = '/pages/file';
      }
    } catch (error) {
      setError(typeof error === 'string' ? error : '登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 添加 Google 回调函数到 window 对象
  useEffect(() => {
    (window as any).handleGoogleLogin = handleGoogleLogin;

    return () => {
      delete (window as any).handleGoogleLogin;
    };
  }, []);

  return {
    credentials,
    error,
    success,
    isLoading,
    showPassword,
    setShowPassword,
    handleChange,
    handleEmailLogin,
    handleGitHubLogin,
    handleGoogleLogin
  };
}; 