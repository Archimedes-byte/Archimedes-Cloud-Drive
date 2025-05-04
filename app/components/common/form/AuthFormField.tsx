'use client';

import React, { ReactNode, useState } from 'react';
import { Input } from '@/app/components/ui/ant';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import FormField from './FormField';
import styles from '@/app/styles/auth/shared.module.css';

export interface AuthFormFieldProps {
  type: 'text' | 'email' | 'password';
  name: string;
  label: string;
  value: string | undefined;
  icon: ReactNode;
  suffixIcon?: ReactNode;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  touched?: boolean;
  required?: boolean;
  autoComplete?: string;
}

/**
 * 统一的表单字段组件
 * 用于登录和注册表单
 */
const AuthFormField: React.FC<AuthFormFieldProps> = ({
  type,
  name,
  label,
  value,
  icon,
  suffixIcon,
  placeholder,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  autoComplete
}) => {
  // 密码显示状态
  const [showPassword, setShowPassword] = useState(false);
  
  // 仅当字段被触摸且有错误时显示错误信息
  const showError = touched && error;
  
  // 确保值不是undefined
  const safeValue = value || '';
  
  // 确定autoComplete属性的值
  const getAutoComplete = () => {
    if (autoComplete) return autoComplete;
    
    if (type === 'password') {
      // 根据字段名确定是密码还是确认密码
      return name.includes('confirm') ? 'new-password' : 
             name.includes('new') ? 'new-password' : 'current-password';
    }
    
    if (type === 'email') return 'email';
    if (name === 'name') return 'name';
    
    return undefined;
  };
  
  // 密码可见性图标
  const renderPasswordIcon = () => {
    if (type !== 'password') return suffixIcon;
    
    return showPassword ? (
      <EyeInvisibleOutlined 
        className={styles.passwordVisibilityIcon} 
        onClick={() => setShowPassword(false)} 
      />
    ) : (
      <EyeOutlined 
        className={styles.passwordVisibilityIcon} 
        onClick={() => setShowPassword(true)} 
      />
    );
  };
  
  return (
    <div className={styles.inputGroup}>
      <FormField
        label={label}
        icon={icon}
        error={showError ? error : undefined}
      >
        <Input
          id={`auth-field-${name}`}
          type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
          name={name}
          value={safeValue}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          autoComplete={getAutoComplete()}
          className={`${styles.input} ${type === 'password' ? styles.passwordField : ''}`}
          suffix={type === 'password' ? renderPasswordIcon() : suffixIcon}
        />
      </FormField>
    </div>
  );
};

export default AuthFormField; 