'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { 
  EyeOutlined, EyeInvisibleOutlined, GithubOutlined, 
  MailOutlined, LockOutlined 
} from '@ant-design/icons';
import { useLogin } from '@/app/hooks/auth';
import styles from './LoginForm.module.css';
import { FormField } from '@/app/components/common/form';
import { Button, Input, Space, Divider, Alert, Typography } from '@/app/components/ui/ant';

const LoginForm: React.FC = () => {
  const {
    credentials,
    error,
    success,
    isLoading,
    showPassword,
    setShowPassword,
    handleChange,
    handleEmailLogin,
    handleGitHubLogin
  } = useLogin();

  // 加载 Google Sign-In 脚本
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className={styles.formContainer}>
      <Typography.Title level={2}>登录您的账户</Typography.Title>
      
      {error && (
        <Alert
          className={styles.message}
          type="error"
          message={error}
          showIcon
        />
      )}

      {success && (
        <Alert
          className={styles.message}
          type="success"
          message={success}
          showIcon
        />
      )}
      
      <div className={styles.socialButtons}>
        <Button
          type="text"
          onClick={handleGitHubLogin}
          className={`${styles.socialIconButton} ${styles.githubButton}`}
          disabled={isLoading}
          aria-label="使用 GitHub 登录"
          icon={<GithubOutlined />}
        />
        
        <Button
          type="text"
          className={`${styles.socialIconButton} ${styles.googleButton}`}
          disabled={isLoading}
          aria-label="使用 Google 登录"
          id="customGoogleButton"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"
                fill="currentColor"
              />
            </svg>
          }
        />
      </div>

      <Divider className={styles.divider}>或</Divider>

      <form className={styles.loginForm} onSubmit={handleEmailLogin}>
        <FormField label="邮箱" icon={<MailOutlined />}>
          <Input
            type="email"
            value={credentials.email}
            onChange={(e) => handleChange(e, 'email')}
            required
            placeholder="请输入邮箱"
            className={styles.input}
          />
        </FormField>

        <FormField label="密码" icon={<LockOutlined />}>
          <Input.Password
            value={credentials.password}
            onChange={(e) => handleChange(e, 'password')}
            required
            placeholder="请输入密码"
            className={styles.input}
            iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
          />
        </FormField>

        <Button 
          type="primary"
          htmlType="submit" 
          className={`${styles.button} ${isLoading ? styles.loading : ''}`}
          loading={isLoading}
          block
        >
          {isLoading ? '登录中...' : '登录'}
        </Button>
      </form>

      <div className={styles.link}>
        <Space>
          <span>还没有账户？</span>
          <Link href="/pages/auth/register">注册新账户</Link>
        </Space>
      </div>
      
      {/* 隐藏Google按钮但保留功能 */}
      <div className={styles.hiddenGoogleAuth}>
        <div
          id="g_id_onload"
          data-client_id="453775143177-08ksc0d8k1uq11j0spnjdm1deqvl32ku.apps.googleusercontent.com"
          data-context="signin"
          data-callback="handleGoogleLogin"
          data-itp_support="true"
        />
        
        <div 
          className="g_id_signin"
          data-type="standard"
          data-size="large"
          data-theme="outline"
          data-text="sign_in_with"
          data-shape="rectangular"
          data-logo_alignment="left"
        />
      </div>
    </div>
  );
};

export default LoginForm; 