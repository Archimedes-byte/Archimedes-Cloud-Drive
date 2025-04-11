'use client';

import React from 'react';
import { AppStateProvider as GlobalStateProvider } from '../context/AppStateContext';

/**
 * 全局状态提供者组件
 * 用于包装页面并提供应用全局状态
 */
export function AppStateProvider({ children }: { children: React.ReactNode }) {
  return (
    <GlobalStateProvider>
      {children}
    </GlobalStateProvider>
  );
} 