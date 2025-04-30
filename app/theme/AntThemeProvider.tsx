'use client';

import React from 'react';
import { ConfigProvider } from 'antd';
import { customTheme } from '@/app/theme';

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
  return (
    <ConfigProvider theme={customTheme}>
      {children}
    </ConfigProvider>
  );
}

export default AntThemeProvider; 