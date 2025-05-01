'use client';

import React, { useEffect, useState } from 'react';
import { ConfigProvider, theme } from 'antd';
import { getAntTheme } from '@/app/theme/ant-theme';
import { useTheme } from './useTheme';

/**
 * Ant Design 主题提供者组件
 * 用于在应用程序中应用自定义主题
 * 
 * 用法示例:
 * ```tsx
 * import { AntThemeProvider } from '@/app/theme/AntThemeProvider';
 * 
 * function App({ children }) {
 *   return (
 *     <AntThemeProvider>
 *       {children}
 *     </AntThemeProvider>
 *   );
 * }
 * ```
 */
export function AntThemeProvider({ children }: { children: React.ReactNode }) {
  // 使用主题钩子获取当前主题
  const { themeStyle } = useTheme();
  
  // 生成Ant Design主题配置
  const antTheme = getAntTheme(themeStyle);
  
  return (
    <ConfigProvider 
      theme={{
        ...antTheme,
        algorithm: theme.defaultAlgorithm
      }}
    >
      {children}
    </ConfigProvider>
  );
}

export default AntThemeProvider; 