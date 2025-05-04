'use client';

import React, { useEffect, useState } from 'react';
import { ConfigProvider, theme } from 'antd';
import { getAntTheme } from '@/app/theme/ant-theme';
import { useTheme } from './useTheme';
import { useSession } from 'next-auth/react';

export function AntThemeProvider({ children }: { children: React.ReactNode }) {
  // 服务器端使用默认主题，客户端使用useTheme钩子获取主题
  const [mounted, setMounted] = useState(false);
  const [stylesInjected, setStylesInjected] = useState(false);
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  
  // 检测客户端挂载
  useEffect(() => {
    setMounted(true);
    
    // 注入具有更高优先级的自定义样式以解决样式闪烁问题
    if (!stylesInjected) {
      const styleElement = document.createElement('style');
      styleElement.setAttribute('id', 'priority-ant-styles');
      styleElement.innerHTML = `
        /* 密码输入框统一样式 - 高优先级 */
        .ant-input-affix-wrapper-status-error {
          border-color: #ff4d4f !important;
        }
        
        .ant-input-affix-wrapper {
          border-radius: 8px !important;
          transition: all 0.3s ease !important;
        }
        
        .ant-input-affix-wrapper:hover {
          border-color: #3b82f6 !important;
        }
        
        .ant-input-affix-wrapper-focused,
        .ant-input-affix-wrapper:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
          outline: 0 !important;
        }
        
        /* 密码图标统一样式 */
        .ant-input-password-icon {
          color: #6b7280 !important;
          transition: color 0.2s ease !important;
        }
        
        .ant-input-password-icon:hover {
          color: #3b82f6 !important;
        }
      `;
      document.head.appendChild(styleElement);
      setStylesInjected(true);
    }
  }, [stylesInjected]);
  
  // 使用主题钩子获取当前主题 (客户端)
  const { themeStyle } = useTheme({
    // 在服务器端渲染时不应用主题，避免hydration错误
    // 只有登录状态才应用主题，未登录使用默认主题
    applyOnMount: mounted && isLoggedIn,
    // 不保存主题到localStorage，而是从数据库读取
    saveToStorage: false
  });
  
  // 生成Ant Design主题配置
  const antTheme = getAntTheme(themeStyle);
  
  return (
    <ConfigProvider 
      theme={{
        ...antTheme,
        algorithm: theme.defaultAlgorithm,
        // 强制使用相同的哈希算法
        hashed: true
      }}
      // 确保客户端和服务端生成相同的哈希值前缀
      prefixCls="ant"
    >
      {children}
    </ConfigProvider>
  );
}

export default AntThemeProvider; 