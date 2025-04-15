'use client';

import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerLinks}>
          <div className={styles.footerSection}>
            <h4>关于我们</h4>
            <ul>
              <li><Link href="#">公司简介</Link></li>
              <li><Link href="#">联系方式</Link></li>
              <li><Link href="#">加入我们</Link></li>
            </ul>
          </div>
          <div className={styles.footerSection}>
            <h4>帮助中心</h4>
            <ul>
              <li><Link href="#">常见问题</Link></li>
              <li><Link href="#">使用教程</Link></li>
              <li><Link href="#">意见反馈</Link></li>
            </ul>
          </div>
          <div className={styles.footerSection}>
            <h4>服务条款</h4>
            <ul>
              <li><Link href="#">隐私政策</Link></li>
              <li><Link href="#">用户协议</Link></li>
              <li><Link href="#">版权声明</Link></li>
            </ul>
          </div>
        </div>
        <div className={styles.footerCopyright}>
          <p>© 2025 Archimedes' Cloud Drive. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 