'use client';

import React, { useState, useEffect, createContext, useContext, forwardRef, useImperativeHandle } from 'react';
import styles from './Toaster.module.css';
import { addThemeChangeListener, ThemeStyle } from '@/app/shared/themes';
import { 
  CheckCircle,
  Info,
  AlertCircle, 
  X,
  XCircle
} from 'lucide-react';

// 定义Toast类型
export type ToastType = 'success' | 'error' | 'warning' | 'info';

// 定义单个Toast的接口
interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

// 定义Toast上下文类型
interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}

// 创建Toast上下文
const ToastContext = createContext<ToastContextType | undefined>(undefined);

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
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <ToastContainer themeStyle={themeStyle} />
    </ToastContext.Provider>
  );
};

// 创建Toast容器组件
const ToastContainer: React.FC<{ themeStyle: ThemeStyle | null }> = ({ themeStyle }) => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  const { toasts, hideToast } = context;

  // 根据主题获取颜色
  const getToastColor = (type: ToastType) => {
    if (!themeStyle) return {};
    
    // 根据Toast类型选择合适的主题颜色
    let color = '';
    let bgColor = '';
    
    switch (type) {
      case 'success':
        color = 'var(--theme-success, #48bb78)';
        bgColor = 'var(--theme-success-light, rgba(72, 187, 120, 0.2))';
        break;
      case 'error':
        color = 'var(--theme-error, #f56565)';
        bgColor = 'var(--theme-error-light, rgba(245, 101, 101, 0.2))';
        break;
      case 'warning':
        color = 'var(--theme-warning, #ecc94b)';
        bgColor = 'var(--theme-warning-light, rgba(236, 201, 75, 0.2))';
        break;
      case 'info':
      default:
        color = themeStyle.primary;
        bgColor = `${themeStyle.primary}20`; // 20 是透明度 0.2 的十六进制表示
        break;
    }
    
    return {
      '--toast-color': color,
      '--toast-bg-color': bgColor,
    } as React.CSSProperties;
  };

  return (
    <div className={styles.toastContainer}>
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className={`${styles.toast} ${styles[toast.type]}`}
          onClick={() => hideToast(toast.id)}
          style={getToastColor(toast.type)}
        >
          <div className={styles.toastContent}>
            {getToastIcon(toast.type)}
            <p>{toast.message}</p>
          </div>
          <button 
            className={styles.closeButton}
            onClick={(e) => {
              e.stopPropagation();
              hideToast(toast.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

// 获取与Toast类型对应的图标
function getToastIcon(type: ToastType) {
  switch (type) {
    case 'success':
      return <span className={styles.icon}>✓</span>;
    case 'error':
      return <span className={styles.icon}>✕</span>;
    case 'warning':
      return <span className={styles.icon}>⚠</span>;
    case 'info':
      return <span className={styles.icon}>ℹ</span>;
    default:
      return null;
  }
}

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