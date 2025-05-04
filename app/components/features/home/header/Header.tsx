'use client';

import React from 'react';
import Link from 'next/link';
import { CloudIcon } from 'lucide-react';
import styles from './Header.module.css';
import { AUTH_CONSTANTS } from '@/app/constants/auth';

interface HeaderProps {
  onLoginClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
  // 处理登录点击
  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // 如果传入了onLoginClick回调则使用，否则触发全局登录模态框事件
    if (onLoginClick) {
      onLoginClick();
    } else {
      window.dispatchEvent(new Event(AUTH_CONSTANTS.EVENTS.LOGIN_MODAL));
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <div className={styles.logoNav}>
          <h1>
            <CloudIcon size={24} className={styles.headerIcon} />
            Archimedes' Cloud Drive
          </h1>
          <nav className={styles.nav}>
            <Link href="/">首页</Link>
            <a href="#" onClick={handleLoginClick}>登录</a>
            <Link href={AUTH_CONSTANTS.ROUTES.REGISTER}>注册</Link>
            <Link href="#">帮助中心</Link>
            <Link href="#">关于我们</Link>
          </nav>
        </div>
        <div className={styles.headerActions}>
          <Link href={AUTH_CONSTANTS.ROUTES.REGISTER} className={styles.registerBtn}>免费注册</Link>
        </div>
      </div>
    </header>
  );
};

export default Header; 