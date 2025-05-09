'use client';

/**
 * 统一的错误消息展示组件
 * 
 * 用于一致地展示系统中的错误消息
 */
import React from 'react';
import { Alert } from 'antd';
import { AlertProps } from 'antd/lib/alert';
import { ExclamationCircleOutlined } from '@ant-design/icons';

interface ErrorMessageProps {
  error?: string | null;
  title?: string;
  type?: AlertProps['type'];
  showIcon?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClose?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  title = '错误',
  type = 'error',
  showIcon = true,
  className = '',
  style,
  onClose
}) => {
  if (!error) return null;

  return (
    <Alert
      message={title}
      description={error}
      type={type}
      showIcon={showIcon}
      icon={showIcon ? <ExclamationCircleOutlined /> : undefined}
      className={`mb-4 ${className}`}
      style={style}
      closable={!!onClose}
      onClose={onClose}
    />
  );
};

export default ErrorMessage; 