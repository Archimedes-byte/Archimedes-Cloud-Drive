import React from 'react';
import { Session } from 'next-auth';
import { UserInfo } from '@/app/dashboard/page';
import styles from './ProfileContent.module.css';

interface ProfileContentProps {
  session: Session;
  userInfo: UserInfo;
  isLoading: boolean;
}

const ProfileContent = ({ session, userInfo, isLoading }: ProfileContentProps) => {
  // 格式化账户创建时间
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知';
    try {
      const date = new Date(dateString);
      
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        console.error('无效的日期字符串:', dateString);
        return '未知';
      }
      
      // 使用更友好的日期格式
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('日期格式化错误:', error);
      return '未知';
    }
  };

  return (
    <div className={styles.container}>
      {isLoading && (
        <div className={styles.loadingMessage}>
          <div className={styles.loadingSpinner}></div>
          <span>数据加载中...</span>
        </div>
      )}
      
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>个人信息</h2>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>用户名</span>
          <p className={styles.fieldValue}>{userInfo.displayName || '未设置'}</p>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>个人简介</span>
          <p className={styles.fieldValue}>{userInfo.bio || '未设置'}</p>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>所在地</span>
          <p className={styles.fieldValue}>{userInfo.location || '未设置'}</p>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>个人网站</span>
          <p className={styles.fieldValue}>
            {userInfo.website ? (
              <a href={userInfo.website} target="_blank" rel="noopener noreferrer" className={styles.link}>
                {userInfo.website}
              </a>
            ) : '未设置'}
          </p>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>公司/组织</span>
          <p className={styles.fieldValue}>{userInfo.company || '未设置'}</p>
        </div>
      </div>
      
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>账户信息</h2>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>邮箱</span>
          <p className={styles.fieldValue}>{session.user?.email || '未设置'}</p>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>账户创建时间</span>
          <p className={styles.fieldValue}>{formatDate(userInfo.createdAt)}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileContent; 