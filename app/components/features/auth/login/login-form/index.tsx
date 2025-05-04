'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AUTH_CONSTANTS } from '@/app/constants/auth';
import AuthForm from '../../shared/AuthForm';

/**
 * 登录表单组件
 * 
 * 使用统一的AuthForm组件，减少代码重复
 */
const LoginForm: React.FC = () => {
  const router = useRouter();
  
  // 使用统一的AuthForm组件，指定类型为login
  return (
    <AuthForm 
      formType="login"
      redirectPath={AUTH_CONSTANTS.ROUTES.DEFAULT_SUCCESS}
    />
  );
};

export default LoginForm; 