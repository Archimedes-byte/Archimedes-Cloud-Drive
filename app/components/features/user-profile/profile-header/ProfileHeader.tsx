import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Session } from 'next-auth';
import { UserInfo } from '@/app/dashboard/page';
import { Camera } from 'lucide-react';
import styles from './ProfileHeader.module.css';
import { AvatarModal } from '@/app/components/features/user-profile/avatar';

interface ProfileHeaderProps {
  session: Session;
  userInfo: UserInfo;
  onEditClick: () => void;
  onPasswordClick: () => void;
  isLoading: boolean;
  onAvatarChange?: (avatarUrl: string) => void;
}

const ProfileHeader = ({ 
  session, 
  userInfo,
  onEditClick, 
  onPasswordClick, 
  isLoading,
  onAvatarChange
}: ProfileHeaderProps) => {
  const [avatarError, setAvatarError] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  
  // 使用userInfo中的displayName作为首选，如果没有则使用session中的name
  const displayName = userInfo.displayName || session.user?.name || '未设置昵称';
  
  // 获取用于头像占位符的首字母
  const nameInitial = displayName[0]?.toUpperCase() || '?';

  // 简化头像URL逻辑，直接使用userInfo中的头像或session头像
  const effectiveAvatarUrl = userInfo.avatarUrl || session.user?.image;
  
  // 添加时间戳作为key的一部分，确保每次头像变更都会重新渲染
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const avatarKey = `${effectiveAvatarUrl || 'fallback'}-${refreshKey}`;

  // 添加useEffect监听userInfo.avatarUrl的变化
  useEffect(() => {
    setRefreshKey(Date.now()); // 强制头像重新渲染
    setAvatarError(false); // 重置错误状态
  }, [userInfo.avatarUrl]);

  // 添加深度调试 - 监控props变化
  useEffect(() => {
    console.log('ProfileHeader收到新的userInfo:', 
      { 
        avatarUrl: userInfo.avatarUrl,
        hasAvatar: !!userInfo.avatarUrl,
        displayName: userInfo.displayName
      }
    );
  }, [userInfo]);

  // 打开头像管理弹窗
  const handleAvatarClick = () => {
    setShowAvatarModal(true);
  };

  // 处理头像变更
  const handleAvatarChange = (newAvatarUrl: string) => {
    if (onAvatarChange) {
      onAvatarChange(newAvatarUrl);
    }
    // 强制刷新
    setRefreshKey(Date.now());
  };

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
              onError={() => setAvatarError(true)}
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
              <Camera size={24} />
            </button>
          </div>
        </div>
        <p className={styles.avatarHint}>点击更换头像</p>
      </div>
      
      <div className={styles.info}>
        <h1 className={styles.name}>{displayName}</h1>
        <p className={styles.email}>{session.user?.email || '未设置邮箱'}</p>
        <div className={styles.buttons}>
          <button
            onClick={onEditClick}
            className={styles.editButton}
            disabled={isLoading}
          >
            编辑个人信息
          </button>
          <button
            onClick={onPasswordClick}
            className={styles.passwordButton}
            disabled={isLoading}
          >
            设置密码
          </button>
        </div>
      </div>
      
      {/* 头像管理弹窗 */}
      <AvatarModal 
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        currentAvatarUrl={effectiveAvatarUrl || null}
        userDisplayName={displayName}
        onAvatarChange={handleAvatarChange}
      />
    </div>
  );
};

export default ProfileHeader; 