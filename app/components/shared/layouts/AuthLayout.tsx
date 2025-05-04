'use client';

import React, { ReactNode } from 'react';
import Header from '@/app/components/features/home/header/Header';
import SimpleFooter from './SimpleFooter';
import styles from './AuthLayout.module.css';

interface AuthLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

/**
 * 认证页面专用布局组件
 * 
 * 为登录注册页面提供统一的布局，使用简化版页脚
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  showHeader = true,
  showFooter = true
}) => {
  return (
    <div className={styles.authLayout}>
      {showHeader && <Header />}
      <main className={styles.mainContent}>
        {children}
      </main>
      {showFooter && <SimpleFooter />}
    </div>
  );
};

export default AuthLayout; 