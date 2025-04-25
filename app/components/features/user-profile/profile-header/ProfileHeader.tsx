import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Session } from 'next-auth';
import { UserProfile } from '@/app/hooks/user/useProfile';
import { CameraOutlined } from '@ant-design/icons';
import styles from './ProfileHeader.module.css';
import { AvatarModal } from '@/app/components/features/user-profile/avatar';
import { Button } from '@/app/components/ui/ant';

interface ProfileHeaderProps {
  session: Session;
  userProfile: UserProfile;
  onEditClick: () => void;
  onPasswordClick: () => void;
  isLoading: boolean;
  onAvatarChange?: (avatarUrl: string) => void;
}

const ProfileHeader = ({ 
  session, 
  userProfile,
  onEditClick, 
  onPasswordClick, 
  isLoading,
  onAvatarChange
}: ProfileHeaderProps) => {
  const [avatarError, setAvatarError] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  
  // 使用userProfile中的name作为首选，如果没有则使用session中的name
  const displayName = userProfile.name || session.user?.name || '未设置昵称';
  
  // 获取用于头像占位符的首字母
  const nameInitial = displayName[0]?.toUpperCase() || '?';

  // 简化头像URL逻辑，直接使用userProfile中的头像或session头像
  const effectiveAvatarUrl = userProfile.avatarUrl || session.user?.image;
  
  // 添加时间戳作为key的一部分，确保每次头像变更都会重新渲染
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const avatarKey = `${effectiveAvatarUrl || 'fallback'}-${refreshKey}`;

  // 添加useEffect监听userProfile.avatarUrl的变化
  useEffect(() => {
    setRefreshKey(Date.now()); // 强制头像重新渲染
    setAvatarError(false); // 重置错误状态
  }, [userProfile.avatarUrl]);

  // 添加深度调试 - 监控props变化
  useEffect(() => {
    console.log('ProfileHeader收到新的userProfile:', 
      { 
        avatarUrl: userProfile.avatarUrl,
        hasAvatar: !!userProfile.avatarUrl,
        displayName: userProfile.name
      }
    );
  }, [userProfile]);

  // 打开头像管理弹窗
  const handleAvatarClick = useCallback(() => {
    setShowAvatarModal(true);
  }, []);

  // 处理头像变更
  const handleAvatarChange = useCallback((newAvatarUrl: string) => {
    if (onAvatarChange) {
      onAvatarChange(newAvatarUrl);
    }
    // 强制刷新
    setRefreshKey(Date.now());
  }, [onAvatarChange]);

  // 关闭头像弹窗
  const handleCloseAvatarModal = useCallback(() => {
    setShowAvatarModal(false);
  }, []);

  // 处理头像加载错误
  const handleAvatarError = useCallback(() => {
    setAvatarError(true);
  }, []);

  return (
    <div className={styles.header}>
      <div className={styles.avatarContainer}>
        <div className={styles.avatar} onClick={handleAvatarClick}>
          {effectiveAvatarUrl && !avatarError ? (
            <Image
              key={avatarKey}
              src={effectiveAvatarUrl}
              alt="用户头像"
              width={160}
              height={160}
              className={styles.avatarImage}
              priority
              unoptimized={true}
              onError={handleAvatarError}
            />
          ) : (
            <div className={styles.avatarFallback}>
              <span>{nameInitial}</span>
            </div>
          )}
          
          {/* 头像悬停覆盖层 */}
          <div className={styles.avatarOverlay}>
            <button 
              className={styles.avatarButton} 
              onClick={handleAvatarClick}
              title="管理头像"
            >
              <CameraOutlined style={{ fontSize: 24 }} />
            </button>
          </div>
        </div>
        <p className={styles.avatarHint}>点击更换头像</p>
      </div>
      
      <div className={styles.info}>
        <h1 className={styles.name}>{displayName}</h1>
        <p className={styles.email}>{session.user?.email || '未设置邮箱'}</p>
        <div className={styles.buttons}>
          <Button
            onClick={onEditClick}
            className={styles.editButton}
            disabled={isLoading}
            type="primary"
          >
            编辑个人信息
          </Button>
          <Button
            onClick={onPasswordClick}
            className={styles.passwordButton}
            disabled={isLoading}
          >
            设置密码
          </Button>
        </div>
      </div>
      
      {/* 头像管理弹窗 */}
      <AvatarModal 
        isOpen={showAvatarModal}
        onClose={handleCloseAvatarModal}
        currentAvatarUrl={effectiveAvatarUrl || null}
        userDisplayName={displayName}
        onAvatarChange={handleAvatarChange}
      />
    </div>
  );
};

export default React.memo(ProfileHeader); 