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

  // 检查URL中是否有错误参数
  useEffect(() => {
    // 从URL中获取错误参数
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    
    if (errorParam) {
      let errorMessage = '登录出错，请重试';
      
      // 根据错误类型显示友好的错误信息
      switch (errorParam) {
        case 'OAuthAccountNotLinked':
          errorMessage = '您已经使用其他方式注册，请使用原来的登录方式';
          break;
        case 'OAuthSignin':
        case 'OAuthCallback':
          errorMessage = '第三方登录过程中出现错误，可能是网络问题，请重试';
          break;
        case 'OAuthCreateAccount':
          errorMessage = '无法创建关联账户，请尝试其他登录方式';
          break;
        case 'Callback':
          errorMessage = '回调处理失败，请检查网络连接并重试';
          break;
        case 'Verification':
          errorMessage = '验证链接无效或已过期，请重新验证';
          break;
        case 'AccessDenied':
          errorMessage = '访问被拒绝，您可能没有权限访问此资源';
          break;
        case 'Configuration':
          errorMessage = '服务器配置错误，请联系管理员';
          break;
      }
      
      setError(errorMessage);
      
      // 清除URL中的错误参数，避免用户刷新页面时再次显示错误
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

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
        callbackUrl: '/file_management/main',
        redirect: true
      });

      // 由于设置了redirect:true，如果登录成功，这里的代码不会执行
      // 仅处理错误情况
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      }
    } catch (error) {
      setError('登录失败，请重试');
      setSuccess('');
      setIsLoading(false);
    }
  };

  // GitHub登录
  const handleGitHubLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      await signIn('github', {
        callbackUrl: '/file_management/main',
        redirect: true
      });
      
      // 由于重定向设置，下面代码不会执行，除非发生错误
    } catch (error) {
      setError(typeof error === 'string' ? error : 'GitHub 登录失败，请重试');
      setIsLoading(false);
    }
  };

  // Google登录回调
  const handleGoogleLogin = async (response: any) => {
    try {
      setIsLoading(true);
      setError('');
      
      await signIn('google', {
        credential: response.credential,
        callbackUrl: '/file_management/main',
        redirect: true
      });
      
      // 由于重定向设置，下面代码不会执行，除非发生错误
    } catch (error) {
      setError(typeof error === 'string' ? error : '登录失败，请重试');
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