import React from 'react';
import { AppStateProvider } from './AppStateProvider';

/**
 * 文件管理布局组件
 */
export default function FileManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppStateProvider>
      {children}
    </AppStateProvider>
  );
} 