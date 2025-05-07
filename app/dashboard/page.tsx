"use client"

import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from "react"
import { ArrowLeft } from 'lucide-react'

import { useProfile, usePassword, useTheme } from '@/app/hooks'
import { useToast } from '@/app/components/features/dashboard/toaster/Toaster'
import { AUTH_CONSTANTS } from '@/app/constants/auth'

// 导入组件
import Modal from '@/app/components/features/dashboard/modal'
import ProfileHeader from '@/app/components/features/user-profile/profile-header'
import ProfileContent from '@/app/components/features/dashboard/profile-content'
import ProfileForm from '@/app/components/features/user-profile/ProfileForm'
import type { ProfileFormRef } from '@/app/components/features/user-profile/ProfileForm'
import PasswordForm from '@/app/components/features/user-profile/password-form'
import ProfileCompleteness from '@/app/components/features/user-profile/completeness'
import { AvatarModal } from '@/app/components/features/user-profile/avatar'

import modalStyles from '@/app/components/features/dashboard/modal/Modal.module.css'
import styles from './dashboard.module.css'

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(AUTH_CONSTANTS.EVENTS.LOGIN_MODAL));
      }
    },
  })
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const profileFormRef = useRef<ProfileFormRef>(null)
  
  const { 
    userProfile, 
    isLoading: profileLoading, 
    error: profileError, 
    updateUserProfile, 
    forceRefreshProfile } = useProfile()

  // 使用统一的主题Hook
  const { 
    currentTheme,
    isLoading: themeLoading,
    updateTheme
  } = useTheme();

  const {
    passwordInfo,
    passwordError,
    passwordSuccess,
    isLoading: passwordLoading,
    showPassword,
    showConfirmPassword,
    setShowPassword,
    setShowConfirmPassword,
    handlePasswordChange,
    updatePassword,
    resetPasswordState
  } = usePassword()

  const toast = useToast()

  useEffect(() => {
    if (!userProfile?.theme || themeLoading) return;
    
    const userTheme = userProfile.theme as string;
    console.log(`Dashboard页面:检测到用户主题设置=${userTheme}`);
    
    if (userTheme && currentTheme !== userTheme) {
      console.log(`Dashboard页面:应用用户配置的主题 ${userTheme}`);
      updateTheme(userTheme).catch((error: Error) => {
        console.error('Dashboard页面:应用主题失败:', error);
      });
    }
  }, [userProfile?.theme, currentTheme, updateTheme, themeLoading]);

  const handlePasswordSave = async () => {
    const success = await updatePassword()
    if (success) {
      setIsPasswordModalOpen(false)
      toast.success('密码已成功更新')
    }
  }

  const openPasswordModal = () => {
    resetPasswordState()
    setIsPasswordModalOpen(true)
  }

  const handlePasswordFieldChange = (field: 'password' | 'confirmPassword', value: string) => {
    const mockEvent = {
      target: {
        name: field,
        value: value
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    handlePasswordChange(mockEvent);
  };

  const handleAvatarClick = () => {
    setShowAvatarModal(true);
  };

  const handleCloseAvatarModal = () => {
    setShowAvatarModal(false);
  };

  const renderPasswordFooter = () => (
    <div className={modalStyles.modalFooter}>
      <button
        onClick={() => setIsPasswordModalOpen(false)}
        className={modalStyles.cancelButton || styles.cancelButton}
      >
        取消
      </button>
      <button
        onClick={handlePasswordSave}
        className={modalStyles.saveButton || styles.saveButton}
        disabled={passwordLoading}
      >
        保存密码
      </button>
    </div>
  );

  const renderProfileFooter = () => (
    <div className={modalStyles.modalFooter}>
      <button
        onClick={() => {
          if (profileFormRef.current) {
            profileFormRef.current.handleCancel();
          }
          setIsEditModalOpen(false);
        }}
        className={modalStyles.cancelButton || styles.cancelButton}
      >
        取消
      </button>
      <button
        onClick={() => {
          if (profileFormRef.current) {
            profileFormRef.current.handleSave();
          }
        }}
        className={modalStyles.saveButton || styles.saveButton}
        disabled={profileLoading}
      >
        保存信息
      </button>
    </div>
  );

  const handleAvatarChange = async (avatarUrl: string) => {
    if (!userProfile) return;
    
    try {
      const success = await updateUserProfile({
        name: userProfile.name || '',
        avatarUrl: avatarUrl
      });
      
      if (success) {
        toast.success('头像已更新');
        setShowAvatarModal(false);
        forceRefreshProfile();
      } else {
        toast.error('更新头像失败');
      }
    } catch (error) {
      console.error('更新头像时出错:', error);
      toast.error('更新头像失败');
    }
  };

  if (status === 'loading' || profileLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingCard}>
          <div className={styles.loadingSpinner}></div>
          <h2 className={styles.loadingTitle}>加载中...</h2>
          <p className={styles.loadingText}>正在获取您的个人信息</p>
        </div>
      </div>
    )
  }

  if (profileError) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2 className={styles.errorTitle}>加载失败</h2>
          <p className={styles.errorText}>{profileError}</p>
          <button
            onClick={() => forceRefreshProfile()}
            className={styles.retryButton}
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  if (!session?.user || !userProfile) {
    return null
  }

  return (
    <div className={styles.container}>
      <div className={styles.profile}>
        {/* 返回按钮 */}
        <button 
          onClick={() => router.push('file')}
          className={styles.backButton}
          title="返回文件管理"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className={styles.profileHeader}>
          {/* 隐藏的头像上传input，使用ref代替DOM查询 */}
          <input 
            type="file"
            ref={avatarInputRef}
            accept="image/*"
            className="hidden avatar-upload-input"
            style={{ display: 'none' }}
          />
          
          {/* 个人资料头部 */}
          <ProfileHeader 
            session={session}
            userProfile={userProfile}
            onEditClick={() => setIsEditModalOpen(true)}
            onPasswordClick={openPasswordModal}
            isLoading={profileLoading || passwordLoading}
            onAvatarChange={handleAvatarChange}
          />
        </div>
        
        {/* 资料完整度 */}
        <ProfileCompleteness 
          userProfile={userProfile}
          onEditClick={() => setIsEditModalOpen(true)}
          onAvatarClick={handleAvatarClick}
        />

        {/* 头像管理模态框 - 单独添加用于"完善以下信息"中的头像管理 */}
        <AvatarModal 
          isOpen={showAvatarModal}
          onClose={handleCloseAvatarModal}
          currentAvatarUrl={userProfile.avatarUrl || session.user?.image || null}
          userDisplayName={userProfile.name || session.user?.name || ''}
          onAvatarChange={handleAvatarChange}
        />
        
        {/* 个人资料内容 */}
        <ProfileContent 
          session={session}
          userProfile={userProfile}
          isLoading={profileLoading || passwordLoading}
        />
      </div>

      {/* 编辑个人信息弹窗 */}
      <div className={styles.profileModalStyles}>
        {isEditModalOpen && (
          <Modal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            title="编辑个人信息"
            footer={renderProfileFooter()}
            className="profile-modal"
          >
            <ProfileForm 
              ref={profileFormRef}
              userProfile={userProfile}
              onUpdate={updateUserProfile}
              onComplete={() => {
                setIsEditModalOpen(false)
                toast.success('个人信息已更新')
              }}
              onCancel={() => setIsEditModalOpen(false)}
              className={styles.profileForm}
            />
          </Modal>
        )}
      </div>

      {/* 设置密码弹窗 */}
      <div className={styles.profileModalStyles}>
        {isPasswordModalOpen && (
          <Modal
            isOpen={isPasswordModalOpen}
            onClose={() => setIsPasswordModalOpen(false)}
            title="设置密码"
            footer={renderPasswordFooter()}
            className="password-modal"
          >
            <PasswordForm
              passwordInfo={passwordInfo}
              passwordError={passwordError}
              passwordSuccess={passwordSuccess}
              showPassword={showPassword}
              showConfirmPassword={showConfirmPassword}
              setShowPassword={setShowPassword}
              setShowConfirmPassword={setShowConfirmPassword}
              handlePasswordChange={handlePasswordFieldChange}
              userEmail={session.user.email}
            />
          </Modal>
        )}
      </div>
    </div>
  )
} 