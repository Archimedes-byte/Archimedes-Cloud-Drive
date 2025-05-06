'use client';

import React from 'react';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { AuthFormField } from '@/app/components/common/form';
import { LoginCredentials, RegisterData } from '@/app/types';

// 定义表单字段类型
type FormValues = LoginCredentials | RegisterData;

export interface AuthFormFieldsProps {
  // 表单类型：登录或注册
  formType: 'login' | 'register';
  // 表单状态
  formState: {
    values: FormValues;
    errors: Record<string, string>;
    touched: Record<string, boolean>;
  };
  // 表单事件处理函数
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  // 表单提交按钮文本，可选
  submitLabel?: {
    default: string;
    loading: string;
  };
  // 是否正在加载
  isLoading?: boolean;
  // 密码显示状态
  showPassword?: boolean;
  // 设置密码显示状态
  setShowPassword?: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * 认证表单字段组件
 * 
 * 根据表单类型（登录/注册）渲染相应的表单字段
 */
const AuthFormFields: React.FC<AuthFormFieldsProps> = ({
  formType,
  formState,
  handleChange,
  handleBlur,
  isLoading,
  showPassword,
  setShowPassword
}) => {
  // 判断是否为注册表单值类型
  const isRegisterForm = (values: FormValues): values is RegisterData => {
    return 'confirmPassword' in values;
  };

  // 是否显示名称字段和安全获取name值
  const showNameField = isRegisterForm(formState.values) && 'name' in formState.values;
  const nameValue = isRegisterForm(formState.values) ? 
    String((formState.values as RegisterData).name || '') : '';

  return (
    <>
      {/* 名称字段（仅注册表单且配置显示） */}
      {showNameField && (
        <AuthFormField
          type="text"
          name="name"
          label="姓名"
          icon={<UserOutlined />}
          value={nameValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="请输入姓名"
          error={formState.errors.name}
          touched={formState.touched.name}
        />
      )}
      
      {/* 邮箱字段 */}
      <AuthFormField
        type="email"
        name="email"
        label="邮箱"
        icon={<MailOutlined />}
        value={formState.values.email}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="请输入邮箱"
        error={formState.errors.email}
        touched={formState.touched.email}
        required
      />

      {/* 密码字段 */}
      <AuthFormField
        type={showPassword ? "text" : "password"}
        name="password"
        label="密码"
        icon={<LockOutlined />}
        value={formState.values.password}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={formType === 'register' ? "请输入密码（至少6个字符）" : "请输入密码"}
        error={formState.errors.password}
        touched={formState.touched.password}
        required
        autoComplete={formType === 'register' ? "new-password" : "current-password"}
      />

      {/* 确认密码字段（仅注册表单） */}
      {isRegisterForm(formState.values) && (
        <AuthFormField
          type={showPassword ? "text" : "password"}
          name="confirmPassword"
          label="确认密码"
          icon={<LockOutlined />}
          value={formState.values.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="请再次输入密码"
          error={formState.errors.confirmPassword}
          touched={formState.touched.confirmPassword}
          required
          autoComplete="new-password"
        />
      )}
    </>
  );
};

export default AuthFormFields; 