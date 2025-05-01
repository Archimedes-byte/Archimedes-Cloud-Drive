'use client';

import React, { useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import { AntThemeProvider, applyTheme, THEME_STORAGE_KEY } from '@/app/theme';

interface ProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
}

export default function Providers({ children, session }: ProvidersProps): React.ReactElement {
  const Provider = SessionProvider as any;
  
  // 在初始化时应用主题
  useEffect(() => {
    // 从本地存储加载主题或使用默认主题
    applyTheme(localStorage.getItem(THEME_STORAGE_KEY) || 'default');
  }, []);
  
  return (
    <Provider session={session}>
      <AntThemeProvider>
        {children}
      </AntThemeProvider>
    </Provider>
  );
} 