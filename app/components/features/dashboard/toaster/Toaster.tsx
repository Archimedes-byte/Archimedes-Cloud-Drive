'use client';

import React, { useContext } from 'react';
import { 
  CheckCircleOutlined, CloseCircleOutlined, 
  InfoCircleOutlined, WarningOutlined, CloseOutlined 
} from '@ant-design/icons';
import { Button } from '@/app/components/ui/ant';
import styles from './Toaster.module.css';
import { ToastContext, ToastType, Toast, ToastProvider, useToast } from '@/app/contexts';

// 重新导出 Provider 和 Hook
export { ToastProvider, useToast };

// Toast容器组件
export const ToastContainer: React.FC = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('ToastContainer must be used within a ToastProvider');
  }
  
  const { toasts, hideToast, themeStyle } = context;

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
          <Button 
            type="text"
            className={styles.closeButton}
            onClick={(e) => {
              e.stopPropagation();
              hideToast(toast.id);
            }}
            icon={<CloseOutlined />}
          />
        </div>
      ))}
    </div>
  );
};

// 获取与Toast类型对应的图标
function getToastIcon(type: ToastType) {
  switch (type) {
    case 'success':
      return <CheckCircleOutlined className={styles.icon} />;
    case 'error':
      return <CloseCircleOutlined className={styles.icon} />;
    case 'warning':
      return <WarningOutlined className={styles.icon} />;
    case 'info':
      return <InfoCircleOutlined className={styles.icon} />;
    default:
      return null;
  }
} 