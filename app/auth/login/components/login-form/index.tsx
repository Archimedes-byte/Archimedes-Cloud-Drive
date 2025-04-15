'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Github } from 'lucide-react';
import { useLogin } from '../../hooks/useLogin';
import styles from './LoginForm.module.css';

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
      <h2>登录您的账户</h2>
      
      {error && (
        <div className={`${styles.message} ${styles.error}`}>
          {error}
        </div>
      )}

      {success && (
        <div className={`${styles.message} ${styles.success}`}>
          {success}
        </div>
      )}
      
      <div className={styles.socialButtons}>
        <button
          type="button"
          onClick={handleGitHubLogin}
          className={`${styles.socialIconButton} ${styles.githubButton}`}
          disabled={isLoading}
          aria-label="使用 GitHub 登录"
        >
          <Github size={20} />
        </button>
        
        <button
          type="button"
          className={`${styles.socialIconButton} ${styles.googleButton}`}
          disabled={isLoading}
          aria-label="使用 Google 登录"
          id="customGoogleButton"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      <div className={styles.divider}>或</div>

      <form className={styles.loginForm} onSubmit={handleEmailLogin}>
        <div className={styles.formGroup}>
          <label>邮箱</label>
          <input
            type="email"
            value={credentials.email}
            onChange={(e) => handleChange(e, 'email')}
            required
            placeholder="请输入邮箱"
          />
        </div>

        <div className={styles.formGroup}>
          <label>密码</label>
          <div className={styles.passwordContainer}>
            <input
              type={showPassword ? "text" : "password"}
              value={credentials.password}
              onChange={(e) => handleChange(e, 'password')}
              required
              placeholder="请输入密码"
            />
            <button 
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <button 
          type="submit" 
          className={`${styles.button} ${isLoading ? styles.loading : ''}`}
          disabled={isLoading}
        >
          <span>{isLoading ? '登录中...' : '登录'}</span>
        </button>
      </form>

      <div className={styles.link}>
        <span>还没有账户？</span>
        <Link href="/auth/register">注册新账户</Link>
      </div>
      
      {/* 隐藏Google按钮但保留功能 */}
      <div style={{ display: 'none', position: 'absolute', pointerEvents: 'none' }}>
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