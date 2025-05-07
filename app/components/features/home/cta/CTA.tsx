'use client';

import React from 'react';
import styles from './CTA.module.css';

const CTA: React.FC = () => {
  return (
    <div className={styles.ctaSection}>
      <div className={styles.ctaContent}>
        <h3>立即开始享受云存储的便利</h3>
        <p>注册账户，免费获得5GB存储空间</p>
      </div>
    </div>
  );
};

export default CTA; 