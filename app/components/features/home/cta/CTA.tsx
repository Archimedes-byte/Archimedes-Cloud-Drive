'use client';

import React from 'react';
import Link from 'next/link';
import styles from './CTA.module.css';
import { AUTH_CONSTANTS } from '@/app/constants/auth';

interface CTAProps {
  onLoginClick?: () => void;
}

const CTA: React.FC<CTAProps> = ({ onLoginClick }) => {
  return (
    <div className={styles.ctaSection}>
      <div className={styles.ctaContent}>
        <h3>立即开始享受云存储的便利</h3>
        <p>注册账户，免费获得5GB存储空间</p>
        <div className={styles.ctaButtons}>
          <Link href={AUTH_CONSTANTS.ROUTES.REGISTER} className={styles.ctaButton}>
            免费注册
          </Link>
          {onLoginClick && (
            <button onClick={onLoginClick} className={`${styles.ctaButton} ${styles.loginButton}`}>
              立即登录
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CTA; 