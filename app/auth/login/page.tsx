'use client';

import React from 'react';
import Link from 'next/link';
import styles from './Login.module.css';
import LoginForm from './components/LoginForm';

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.backgroundEffects}>
        <div className={`${styles.bgCircle} ${styles.bgCircle1}`}></div>
        <div className={`${styles.bgCircle} ${styles.bgCircle2}`}></div>
        <div className={`${styles.bgCircle} ${styles.bgCircle3}`}></div>
      </div>

      <main className={styles.content}>
        <div className={styles.header}>
          <Link href="/" className={styles.logo}>
            Archimedes' Cloud Drive
          </Link>
        </div>
        
        <LoginForm />
        
        <div className={styles.footer}>
          <p>© 2025 Archimedes' Cloud Drive. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
} 