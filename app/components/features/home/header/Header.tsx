'use client';

import React from 'react';
import Link from 'next/link';
import { CloudIcon } from 'lucide-react';
import styles from './Header.module.css';

const Header: React.FC = () => {
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
            <Link href="/pages/auth/login">登录</Link>
            <Link href="/pages/auth/register">注册</Link>
            <Link href="#">帮助中心</Link>
            <Link href="#">关于我们</Link>
          </nav>
        </div>
        <div className={styles.headerActions}>
          <Link href="/pages/auth/register" className={styles.registerBtn}>免费注册</Link>
        </div>
      </div>
    </header>
  );
};

export default Header; 