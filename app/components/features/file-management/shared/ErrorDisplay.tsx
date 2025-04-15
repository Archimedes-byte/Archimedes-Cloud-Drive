/**
 * @deprecated 此组件已迁移到新的组件架构中。
 * 请使用 @/app/components/features/file-management/shared/ErrorDisplay 组件。
 */

'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Wifi, Server, CloudOff } from 'lucide-react';
import styles from '../../../../file-management/styles/shared.module.css';

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  errorType?: 'network' | 'auth' | 'server' | 'data' | 'timeout' | 'unknown';
  onRetry?: () => void;
  retryText?: string;
}

/**
 * 显示友好的错误提示，支持不同类型的错误
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title,
  message = '请刷新页面重试或联系管理员',
  errorType = 'unknown',
  onRetry,
  retryText = '重试'
}) => {
  // 根据错误类型获取图标和标题
  const getErrorInfo = () => {
    switch (errorType) {
      case 'network':
        return {
          icon: <Wifi className="w-12 h-12 text-red-500" />,
          defaultTitle: '网络连接错误'
        };
      case 'auth':
        return {
          icon: <AlertTriangle className="w-12 h-12 text-red-500" />,
          defaultTitle: '身份验证失败'
        };
      case 'server':
        return {
          icon: <Server className="w-12 h-12 text-red-500" />,
          defaultTitle: '服务器错误'
        };
      case 'data':
        return {
          icon: <CloudOff className="w-12 h-12 text-red-500" />,
          defaultTitle: '数据加载失败'
        };
      case 'timeout':
        return {
          icon: <AlertTriangle className="w-12 h-12 text-red-500" />,
          defaultTitle: '请求超时'
        };
      default:
        return {
          icon: <AlertTriangle className="w-12 h-12 text-red-500" />,
          defaultTitle: '加载出错'
        };
    }
  };

  const { icon, defaultTitle } = getErrorInfo();
  const displayTitle = title || defaultTitle;

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorCard}>
        <div className={styles.errorIcon}>
          {icon}
        </div>
        <h3 className={styles.errorTitle}>{displayTitle}</h3>
        <p className={styles.errorText}>{message}</p>
        {onRetry && (
          <button 
            className={styles.retryButton}
            onClick={onRetry}
          >
            <RefreshCw className="w-4 h-4" />
            {retryText}
          </button>
        )}
      </div>
    </div>
  );
}; 