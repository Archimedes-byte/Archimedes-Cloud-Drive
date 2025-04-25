'use client';

import React from 'react';
import { Button as AntdButton } from 'antd';
import type { ButtonProps as AntdButtonProps } from 'antd';
import { cn } from '@/app/utils';
import './antButton.css';

/**
 * 自定义按钮组件属性
 */
export interface AntButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'link' | 'ghost' | 'text';
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick?: React.MouseEventHandler<HTMLElement>;
  size?: 'large' | 'middle' | 'small';
  icon?: React.ReactNode;
  children?: React.ReactNode;
  htmlType?: 'button' | 'submit' | 'reset';
  [key: string]: any;
}

/**
 * 基于Ant Design的按钮组件，支持系统主题样式
 */
export const AntButton: React.FC<AntButtonProps> = ({
  variant = 'primary',
  fullWidth = false,
  className,
  children,
  ...props
}) => {
  // 确定按钮类型和类名
  const getTypeAndClass = () => {
    switch (variant) {
      case 'primary':
        return { type: 'primary' as const, className: 'ant-btn-custom-primary' };
      case 'secondary':
        return { type: 'default' as const, className: 'ant-btn-custom-secondary' };
      case 'success':
        return { type: 'primary' as const, className: 'ant-btn-custom-success' };
      case 'danger':
        return { type: 'primary' as const, className: 'ant-btn-custom-danger' };
      case 'link':
        return { type: 'link' as const, className: '' };
      case 'ghost':
        return { type: 'default' as const, className: 'ant-btn-custom-ghost' };
      case 'text':
        return { type: 'text' as const, className: '' };
      default:
        return { type: 'primary' as const, className: 'ant-btn-custom-primary' };
    }
  };
  
  const { type, className: variantClassName } = getTypeAndClass();
  
  // 根据fullWidth属性添加宽度类
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <AntdButton
      type={type}
      className={cn(variantClassName, widthClass, className)}
      {...props}
    >
      {children}
    </AntdButton>
  );
};

export default AntButton; 