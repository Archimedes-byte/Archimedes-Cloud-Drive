'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/ant';
import { GithubOutlined } from '@ant-design/icons';
import { signIn } from 'next-auth/react';
import { AUTH_CONSTANTS } from '@/app/constants/auth';
import AuthForm from '../../shared/AuthForm';
import styles from './login-form.module.css';

/**
 * 登录表单组件
 * 
 * 使用统一的AuthForm组件，减少代码重复
 */
const LoginForm: React.FC = () => {
  const router = useRouter();
  
  // 处理GitHub登录
  const handleGithubLogin = async () => {
    await signIn('github', { 
      callbackUrl: AUTH_CONSTANTS.ROUTES.DEFAULT_SUCCESS
    });
  };
  
  // GitHub登录按钮
  const githubLoginButton = (
    <Button 
      icon={<GithubOutlined />}
      type="default"
      size="large"
      block
      onClick={handleGithubLogin}
      className={styles.githubButton}
    >
      通过GitHub登录
    </Button>
  );
  
  // 使用统一的AuthForm组件，指定类型为login
  return (
    <AuthForm 
      formType="login"
      redirectPath={AUTH_CONSTANTS.ROUTES.DEFAULT_SUCCESS}
      extraButtons={githubLoginButton}
    />
  );
};

export default LoginForm; 