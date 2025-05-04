'use client';

import React from 'react';
import styles from './SimpleFooter.module.css';

const SimpleFooter: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerCopyright}>
          <p>© 2025 Archimedes' Cloud Drive. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default SimpleFooter; 