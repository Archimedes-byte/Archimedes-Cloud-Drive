'use client';

import React, { ReactNode } from 'react';
import Header from '@/app/components/features/home/header/Header';
import Footer from '@/app/components/features/home/footer/Footer';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  onLoginClick?: () => void;
}

/**
 * 应用共享布局组件
 * 
 * 可在首页、登录、注册等页面共享使用的布局组件
 */
const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  showHeader = true,
  showFooter = true,
  onLoginClick
}) => {
  return (
    <div className={styles.appLayout}>
      {showHeader && <Header onLoginClick={onLoginClick} />}
      <main className={styles.mainContent}>
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default AppLayout; 