'use client';

import React, { ReactNode } from 'react';
import { Input } from '@/app/components/ui/ant';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import styles from './PasswordInput.module.css';

interface PasswordInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onPressEnter?: React.KeyboardEventHandler<HTMLInputElement>;
  id?: string;
  name?: string;
  autoComplete?: string;
  suffixIcon?: ReactNode;
}

/**
 * 统一的密码输入组件
 * 
 * 用于替代直接使用Ant Design的Input.Password组件，
 * 确保在整个应用中密码输入框样式统一
 */
const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  placeholder = "请输入密码",
  className = "",
  required = false,
  onFocus,
  onBlur,
  onPressEnter,
  id,
  name,
  autoComplete = "current-password",
  suffixIcon
}) => {
  // 使用一致的图标渲染器，自定义图标优先
  const renderIcon = (visible: boolean) => {
    if (suffixIcon) return suffixIcon;
    return visible ? <EyeOutlined /> : <EyeInvisibleOutlined />;
  };

  return (
    <Input.Password
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      onPressEnter={onPressEnter}
      required={required}
      placeholder={placeholder}
      className={`${styles.passwordInput} ${className}`}
      iconRender={renderIcon}
      autoComplete={autoComplete}
    />
  );
};

export default PasswordInput; 