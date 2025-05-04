'use client';

/**
 * Toast上下文
 * 
 * 提供全局提示消息功能
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { addThemeChangeListener } from '@/app/theme';
import type { ThemeStyle } from '@/app/theme/theme-definitions';

// 定义Toast类型
export type ToastType = 'success' | 'error' | 'warning' | 'info';

// 定义单个Toast的接口
export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

// 定义Toast上下文类型
interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => string;
  hideToast: (id: string) => void;
  themeStyle: ThemeStyle | null;
}

// 创建Toast上下文
export const ToastContext = createContext<ToastContextType | undefined>(undefined);

// 创建Toast上下文提供者
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [themeStyle, setThemeStyle] = useState<ThemeStyle | null>(null);

  // 监听主题变化
  useEffect(() => {
    const removeListener = addThemeChangeListener((themeId, style) => {
      setThemeStyle(style);
    });
    
    return () => removeListener();
  }, []);

  // 显示一个新的toast
  const showToast = (message: string, type: ToastType = 'info', duration: number = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { id, message, type, duration };
    
    setToasts(prevToasts => [...prevToasts, newToast]);
    
    // 设置自动关闭
    setTimeout(() => {
      hideToast(id);
    }, duration);
    
    return id;
  };

  // 隐藏一个toast
  const hideToast = (id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast, themeStyle }}>
      {children}
    </ToastContext.Provider>
  );
};

// 创建自定义钩子用于在组件中使用toast
export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return {
    showToast: context.showToast,
    hideToast: context.hideToast,
    success: (message: string, duration?: number) => 
      context.showToast(message, 'success', duration),
    error: (message: string, duration?: number) => 
      context.showToast(message, 'error', duration),
    warning: (message: string, duration?: number) => 
      context.showToast(message, 'warning', duration),
    info: (message: string, duration?: number) => 
      context.showToast(message, 'info', duration),
  };
}; 