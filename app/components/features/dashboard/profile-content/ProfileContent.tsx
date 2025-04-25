import React from 'react';
import { Session } from 'next-auth';
import { UserProfile } from '@/app/hooks/user/useProfile';
import styles from './ProfileContent.module.css';
import { Card, Typography, Spin, Divider } from '@/app/components/ui/ant';
import { Descriptions } from 'antd';

interface ProfileContentProps {
  session: Session;
  userProfile: UserProfile;
  isLoading: boolean;
}

const ProfileContent = ({ session, userProfile, isLoading }: ProfileContentProps) => {
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

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin tip="数据加载中..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Card className={styles.section}>
        <Typography.Title level={4} className={styles.sectionTitle}>个人信息</Typography.Title>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="用户名">{userProfile.name || '未设置'}</Descriptions.Item>
          <Descriptions.Item label="个人简介">{userProfile.bio || '未设置'}</Descriptions.Item>
          <Descriptions.Item label="所在地">{userProfile.location || '未设置'}</Descriptions.Item>
          <Descriptions.Item label="个人网站">
            {userProfile.website ? (
              <a href={userProfile.website} target="_blank" rel="noopener noreferrer" className={styles.link}>
                {userProfile.website}
              </a>
            ) : '未设置'}
          </Descriptions.Item>
          <Descriptions.Item label="公司/组织">{userProfile.company || '未设置'}</Descriptions.Item>
        </Descriptions>
      </Card>
      
      <Divider />
      
      <Card className={styles.section}>
        <Typography.Title level={4} className={styles.sectionTitle}>账户信息</Typography.Title>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="邮箱">{session.user?.email || '未设置'}</Descriptions.Item>
          <Descriptions.Item label="账户创建时间">{formatDate(userProfile.createdAt)}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default ProfileContent; 