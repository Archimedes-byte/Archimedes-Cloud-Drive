'use client';

import React from 'react';
import { Button as AntdButton } from 'antd';
import type { ButtonProps as AntdButtonProps } from 'antd';
import { cn } from '@/app/utils/format';
import './antButton.css';
import { useTheme } from '@/app/hooks';

/**
 * 自定义按钮组件属性
 */
export interface AntButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'link' | 'ghost' | 'text' | 
            'default' | 'destructive' | 'outline';
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick?: React.MouseEventHandler<HTMLElement>;
  size?: 'large' | 'middle' | 'small' | 'lg' | 'sm';
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
  size,
  ...props
}) => {
  // 获取当前主题信息
  const { themeStyle } = useTheme();
  
  // 确定按钮样式模式：如果主题有secondary颜色，则使用渐变模式，否则使用纯色模式
  // 添加空值检查，避免themeStyle为null时出错
  const styleMode = themeStyle?.secondary ? 'gradient-mode' : 'pure-mode';
  
  // 确定按钮类型和类名
  const getTypeAndClass = () => {
    // 将原Button的variant映射到AntdButton的type
    switch (variant) {
      case 'primary':
        return { type: 'primary' as const, className: `ant-btn-custom-primary ${styleMode}` };
      case 'secondary':
        return { type: 'default' as const, className: 'ant-btn-custom-secondary' };
      case 'success':
        return { type: 'primary' as const, className: `ant-btn-custom-success ${styleMode}` };
      case 'danger':
      case 'destructive':
        return { type: 'primary' as const, className: `ant-btn-custom-danger ${styleMode}` };
      case 'link':
        return { type: 'link' as const, className: '' };
      case 'ghost':
        return { type: 'default' as const, className: 'ant-btn-custom-ghost' };
      case 'text':
        return { type: 'text' as const, className: '' };
      case 'outline':
        return { type: 'default' as const, className: 'ant-btn-custom-outline' };
      case 'default':
      default:
        return { type: 'primary' as const, className: `ant-btn-custom-primary ${styleMode}` };
    }
  };
  
  const { type, className: variantClassName } = getTypeAndClass();
  
  // 转换size属性
  const convertSize = () => {
    if (!size) return 'middle';
    if (size === 'lg') return 'large';
    if (size === 'sm') return 'small';
    return size;
  };
  
  // 根据fullWidth属性添加宽度类
  const widthClass = fullWidth ? 'w-full' : '';

  // 准备传递给AntdButton的属性
  const antButtonProps: AntdButtonProps = {
    ...props,
    type: type,
    className: cn(variantClassName, widthClass, className),
    size: convertSize() as AntdButtonProps['size']
  };

  return (
    <AntdButton {...antButtonProps}>
      {children}
    </AntdButton>
  );
};

export default AntButton; 