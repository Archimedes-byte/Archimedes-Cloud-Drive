'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import { AntThemeProvider } from '@/app/theme';
import { AuthProvider } from '@/app/contexts/auth';

/**
 * 应用提供者组件
 * 
 * 集中管理所有全局上下文提供者
 */
interface ProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
}

/**
 * 应用提供者组件
 * 
 * 按照从外到内的顺序组织提供者：
 * 1. 会话提供者 (NextAuth)
 * 2. 主题提供者
 * 3. 认证提供者 (包含登录模态框和错误处理)
 */
export default function Providers({ children, session }: ProvidersProps) {
  // 处理NextAuth SessionProvider类型问题
  const NextAuthProvider = SessionProvider as any;
  
  return (
    <NextAuthProvider session={session}>
      <AntThemeProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </AntThemeProvider>
    </NextAuthProvider>
  );
} 