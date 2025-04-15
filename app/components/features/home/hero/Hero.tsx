'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronDown, FileText, FileImage, FileVideo, FileArchive, FolderIcon, ShareIcon, LockIcon, DatabaseIcon, FileIcon, BookmarkIcon, Cloud } from 'lucide-react';
import styles from './Hero.module.css';

interface HeroProps {
  onExploreClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onExploreClick }) => {
  return (
    <div className={styles.heroSection}>
      <div className={styles.heroContent}>
        <h2 className={styles.heroTitle}>记录每一份热爱<br/>让美好永远陪伴</h2>
        <p className={styles.heroDescription}>
          为你电脑/手机中的文件提供云备份、预览、分享等服务，帮你更便捷安全地管理数据。
        </p>
        <div className={styles.heroActions}>
          <Link
            href="/auth/login"
            className={`${styles.heroButton} ${styles.primaryButton}`}
          >
            去登录
          </Link>
          <button 
            onClick={onExploreClick}
            className={`${styles.heroButton} ${styles.secondaryButton}`}
          >
            了解更多 <ChevronDown size={16} />
          </button>
        </div>
      </div>
      <div className={styles.heroImage}>
        <div className={styles.floatingElements}>
          {/* 中心图标 */}
          <div className={styles.centerIcon}>
            <Cloud size={48} color="#3b82f6" />
          </div>
        
          {/* 蓝色图标组 - 保留关键图标 */}
          <div className={`${styles.fileIcon} ${styles.circleOne} ${styles.item1}`}>
            <FileText size={32} color="#3b82f6" />
          </div>
          <div className={`${styles.fileIcon} ${styles.circleOne} ${styles.item2}`}>
            <FileImage size={32} color="#3b82f6" />
          </div>
          <div className={`${styles.fileIcon} ${styles.circleOne} ${styles.item3}`}>
            <FileVideo size={32} color="#3b82f6" />
          </div>

          {/* 绿色图标组 - 保留关键图标 */}
          <div className={`${styles.fileIcon} ${styles.circleTwo} ${styles.item1}`}>
            <FileIcon size={32} color="#10b981" />
          </div>
          <div className={`${styles.fileIcon} ${styles.circleTwo} ${styles.item3}`}>
            <LockIcon size={32} color="#10b981" />
          </div>

          {/* 黄色图标组 - 保留关键图标 */}
          <div className={`${styles.fileIcon} ${styles.circleThree} ${styles.item1}`}>
            <FolderIcon size={32} color="#f59e0b" />
          </div>
          <div className={`${styles.fileIcon} ${styles.circleThree} ${styles.item3}`}>
            <ShareIcon size={32} color="#f59e0b" />
          </div>

          {/* 紫色图标组 - 保留关键图标 */}
          <div className={`${styles.fileIcon} ${styles.circleFour} ${styles.item1}`}>
            <FileArchive size={32} color="#8b5cf6" />
          </div>
          <div className={`${styles.fileIcon} ${styles.circleFour} ${styles.item2}`}>
            <DatabaseIcon size={32} color="#8b5cf6" />
          </div>
        </div>
      </div>
      <div className={styles.scrollIndicator}>
        <ChevronDown size={24} className={styles.bounce} onClick={onExploreClick} />
      </div>
    </div>
  );
};

export default Hero; 