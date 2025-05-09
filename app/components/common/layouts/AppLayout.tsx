'use client';

/**
 * 应用主布局组件
 * 
 * 提供统一的页面布局结构
 */
import React from 'react';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  header,
  sidebar,
  children,
  footer,
  className = ''
}) => {
  return (
    <div className={`${styles.appLayout} ${className}`}>
      {header && <header className={styles.header}>{header}</header>}
      <div className={styles.container}>
        {sidebar && <aside className={styles.sidebar}>{sidebar}</aside>}
        <main className={styles.content}>{children}</main>
      </div>
      {footer && <footer className={styles.footer}>{footer}</footer>}
    </div>
  );
};

export default AppLayout; 