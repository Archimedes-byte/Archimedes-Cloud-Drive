'use client';

import React, { useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import { ConfigProvider } from 'antd';
import { customTheme, applyTheme } from '@/app/theme';

interface ProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
}

export default function Providers({ children, session }: ProvidersProps): React.ReactElement {
  const Provider = SessionProvider as any;
  
  // 在初始化时应用主题
  useEffect(() => {
    // 应用当前主题，自动检测深色模式偏好
    const prefersDarkMode = typeof window !== 'undefined' && 
      window.matchMedia && 
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // 从本地存储加载主题或使用默认主题
    applyTheme(localStorage.getItem('user-theme') || 'default', prefersDarkMode);
    
    // 监听系统颜色方案变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // 重新应用当前主题，但使用新的深色模式设置
      applyTheme(localStorage.getItem('user-theme') || 'default', e.matches);
    };
    
    // 添加监听器
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // 兼容旧版浏览器
      mediaQuery.addListener(handleChange);
    }
    
    // 清理监听器
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // 兼容旧版浏览器
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);
  
  return (
    <Provider session={session}>
      <ConfigProvider theme={customTheme}>
        {children}
      </ConfigProvider>
    </Provider>
  );
} 