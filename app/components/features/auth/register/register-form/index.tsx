'use client';

import React, { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from '../../shared/AuthForm';

interface RegisterFormProps {
  extraButtons?: ReactNode;
}

/**
 * 注册表单组件
 * 
 * 使用统一的AuthForm组件，减少代码重复
 */
const RegisterForm: React.FC<RegisterFormProps> = ({ extraButtons }) => {
  const router = useRouter();
  
  // 使用统一的AuthForm组件，指定类型为register，并隐藏底部的导航链接
  return (
    <AuthForm 
      formType="register"
      extraButtons={extraButtons}
      hideNavLinks={true}
    />
  );
};

export default RegisterForm; 