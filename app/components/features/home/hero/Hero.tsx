'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronDown, FileText, FileImage, FileVideo, FileArchive, FolderIcon, ShareIcon, LockIcon, DatabaseIcon, FileIcon as LucideFileIcon, BookmarkIcon, Cloud } from 'lucide-react';
import styles from './Hero.module.css';
import { FileIcon } from '@/app/utils/file/icon-map';
import { AUTH_CONSTANTS } from '@/app/constants/auth';

interface HeroProps {
  onExploreClick: () => void;
  onLoginClick?: () => void;
}

const Hero: React.FC<HeroProps> = ({ onExploreClick, onLoginClick }) => {
  // 处理登录点击
  const handleLoginClick = () => {
    // 如果传入了onLoginClick回调则使用，否则触发全局登录模态框事件
    if (onLoginClick) {
      onLoginClick();
    } else {
      window.dispatchEvent(new Event(AUTH_CONSTANTS.EVENTS.LOGIN_MODAL));
    }
  };

  return (
    <div className={styles.heroSection}>
      <div className={styles.heroContent}>
        <h2 className={styles.heroTitle}>记录每一份热爱<br/>让美好永远陪伴</h2>
        <p className={styles.heroDescription}>
          为你电脑/手机中的文件提供云备份、预览、分享等服务，帮你更便捷安全地管理数据。
        </p>
        <div className={styles.heroActions}>
          <button 
            onClick={handleLoginClick}
            className={`${styles.heroButton} ${styles.primaryButton}`}
          >
            去登录
          </button>
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
            <FileIcon extension="doc" size={32} color="#3b82f6" />
          </div>
          <div className={`${styles.fileIcon} ${styles.circleOne} ${styles.item2}`}>
            <FileIcon extension="jpg" size={32} color="#3b82f6" />
          </div>
          <div className={`${styles.fileIcon} ${styles.circleOne} ${styles.item3}`}>
            <FileIcon extension="mp4" size={32} color="#3b82f6" />
          </div>

          {/* 绿色图标组 - 保留关键图标 */}
          <div className={`${styles.fileIcon} ${styles.circleTwo} ${styles.item1}`}>
            <FileIcon extension="" size={32} color="#10b981" />
          </div>
          <div className={`${styles.fileIcon} ${styles.circleTwo} ${styles.item3}`}>
            <LockIcon size={32} color="#10b981" />
          </div>

          {/* 黄色图标组 - 保留关键图标 */}
          <div className={`${styles.fileIcon} ${styles.circleThree} ${styles.item1}`}>
            <FileIcon isFolder={true} size={32} color="#f59e0b" />
          </div>
          <div className={`${styles.fileIcon} ${styles.circleThree} ${styles.item3}`}>
            <ShareIcon size={32} color="#f59e0b" />
          </div>

          {/* 紫色图标组 - 保留关键图标 */}
          <div className={`${styles.fileIcon} ${styles.circleFour} ${styles.item1}`}>
            <FileIcon extension="zip" size={32} color="#8b5cf6" />
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