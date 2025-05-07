'use client';

import React, { useEffect } from 'react';
import { applyTheme, loadThemeFromStorage } from '@/app/theme/theme-service';

// 布局组件定义
export default function FileManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 确保主题变量在文件管理页面正确应用
  useEffect(() => {
    // 添加主题背景应用类
    if (typeof document !== 'undefined') {
      document.body.classList.add('theme-background-applied');
      document.documentElement.classList.add('theme-background-applied');
      
      // 获取并应用当前主题
      const currentTheme = loadThemeFromStorage() || 'default';
      
      // 延迟应用主题，确保DOM已渲染
      setTimeout(() => {
        applyTheme(currentTheme, false);
      }, 0);
    }
    
    return () => {
      // 保留主题应用类，避免在页面切换时出现闪烁
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col theme-background-applied">
      {children}
    </div>
  );
} 