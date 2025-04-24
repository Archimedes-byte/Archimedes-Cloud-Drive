'use client';

import Link from 'next/link';
import { CloudIcon } from 'lucide-react';
import styles from '@/app/styles/AuthPages.module.css';

/**
 * 认证页面通用的页头组件
 */
export default function AuthHeader() {
  return (
    <header className={styles.header}>
      <h1>
        <CloudIcon size={24} className={styles.headerIcon} />
        Archimedes' Cloud Drive
      </h1>
      <nav className={styles.nav}>
        <Link href="/">首页</Link>
        <Link href="/auth/login">登录</Link>
        <Link href="/auth/register">注册</Link>
        <Link href="#">帮助中心</Link>
      </nav>
    </header>
  );
} 