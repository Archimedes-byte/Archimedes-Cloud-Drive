'use client';

import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  variant?: 'sidebar' | 'file' | 'avatar' | 'text' | 'button' | 'card';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
  count?: number;
  className?: string;
  borderRadius?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  variant = 'text', 
  width, 
  height, 
  animation = 'pulse',
  count = 1,
  className = '',
  borderRadius
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'sidebar':
        return {
          width: width || '100%',
          height: height || '40px',
          borderRadius: borderRadius || '8px'
        };
      case 'file':
        return {
          width: width || '100%',
          height: height || '56px',
          borderRadius: borderRadius || '8px'
        };
      case 'avatar':
        return {
          width: width || '40px',
          height: height || '40px',
          borderRadius: borderRadius || '50%'
        };
      case 'text':
        return {
          width: width || '100%',
          height: height || '16px',
          borderRadius: borderRadius || '4px'
        };
      case 'button':
        return {
          width: width || '120px',
          height: height || '36px',
          borderRadius: borderRadius || '6px'
        };
      case 'card':
        return {
          width: width || '100%',
          height: height || '200px',
          borderRadius: borderRadius || '12px'
        };
      default:
        return {
          width: width || '100%',
          height: height || '16px',
          borderRadius: borderRadius || '4px'
        };
    }
  };

  const renderSkeleton = () => {
    const items = [];
    const baseStyles = getVariantStyles();
    
    for (let i = 0; i < count; i++) {
      items.push(
        <div 
          key={i}
          className={`${styles.skeleton} ${styles[`animation-${animation}`]} ${className}`}
          style={{
            ...baseStyles,
            marginBottom: count > 1 && i < count - 1 ? '8px' : '0'
          }}
        />
      );
    }
    
    return items;
  };

  return <>{renderSkeleton()}</>;
};

export const SkeletonFileList: React.FC = () => {
  return (
    <div className={styles.fileListSkeleton}>
      <div className={styles.fileListHeader}>
        <Skeleton variant="text" width="15%" height="24px" />
        <div className={styles.headerActions}>
          <Skeleton variant="button" width="100px" />
          <Skeleton variant="button" width="100px" />
        </div>
      </div>
      
      <div className={styles.fileItems}>
        {[...Array(8)].map((_, index) => (
          <div key={index} className={styles.fileItemSkeleton}>
            <div className={styles.fileIcon}>
              <Skeleton variant="avatar" width="32px" height="32px" borderRadius="6px" />
            </div>
            <div className={styles.fileDetails}>
              <Skeleton variant="text" width="60%" height="18px" />
              <Skeleton variant="text" width="40%" height="14px" />
            </div>
            <div className={styles.fileActions}>
              <Skeleton variant="button" width="70px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonSidebar: React.FC = () => {
  return (
    <div className={styles.sidebarSkeleton}>
      <div className={styles.sidebarHeader}>
        <Skeleton variant="text" width="70%" height="24px" />
      </div>
      <div className={styles.sidebarContent}>
        <Skeleton variant="sidebar" count={5} />
        <div className={styles.sidebarSection}>
          <Skeleton variant="text" width="50%" height="18px" />
          <Skeleton variant="sidebar" count={3} />
        </div>
      </div>
    </div>
  );
};

export const SkeletonPageLayout: React.FC = () => {
  return (
    <div className={styles.pageLayoutSkeleton}>
      <div className={styles.miniSidebarSkeleton}>
        <Skeleton variant="avatar" width="40px" height="40px" />
        <Skeleton variant="button" width="40px" height="40px" borderRadius="12px" />
        <Skeleton variant="button" width="40px" height="40px" borderRadius="12px" />
      </div>
      
      <div className={styles.sidebarContainerSkeleton}>
        <SkeletonSidebar />
      </div>
      
      <div className={styles.mainContentSkeleton}>
        <div className={styles.topBarSkeleton}>
          <div className={styles.breadcrumbSkeleton}>
            <Skeleton variant="text" width="180px" height="20px" />
          </div>
          <div className={styles.actionButtonsSkeleton}>
            <Skeleton variant="button" width="100px" />
            <Skeleton variant="button" width="100px" />
          </div>
        </div>
        
        <SkeletonFileList />
      </div>
    </div>
  );
}; 