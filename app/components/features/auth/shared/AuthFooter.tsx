'use client';

import styles from '@/app/styles/auth/shared.module.css';
import { Typography } from '@/app/components/ui/ant';

/**
 * 认证页面通用的页脚组件
 */
export default function AuthFooter() {
  return (
    <footer className={styles.footer}>
      <Typography.Paragraph>© 2025 Archimedes' Cloud Drive. All rights reserved.</Typography.Paragraph>
    </footer>
  );
} 