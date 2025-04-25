'use client';

import Link from 'next/link';
import { CloudOutlined } from '@ant-design/icons';
import styles from '@/app/styles/AuthPages.module.css';
import { Typography, Space } from '@/app/components/ui/ant';

/**
 * 认证页面通用的页头组件
 */
export default function AuthHeader() {
  return (
    <header className={styles.header}>
      <Typography.Title level={1} className={styles.headerTitle}>
        <CloudOutlined className={styles.headerIcon} />
        Archimedes' Cloud Drive
      </Typography.Title>
      <nav className={styles.nav}>
        <Space size={16}>
          <Link href="/">首页</Link>
          <Link href="/auth/login">登录</Link>
          <Link href="/auth/register">注册</Link>
          <Link href="#">帮助中心</Link>
        </Space>
      </nav>
    </header>
  );
} 