"use client"

import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from "react"
import { ArrowLeft } from 'lucide-react'

import { useProfile, usePassword } from '@/app/hooks'
import { useToast } from '@/app/components/features/dashboard/toaster/Toaster'
import { applyTheme as applyThemeService } from '@/app/components/ui/themes';
import { createProfileUpdate } from '@/app/utils/user/profile'

// 导入组件
import Modal from '@/app/components/features/dashboard/modal'
import ProfileHeader from '@/app/components/features/user-profile/profile-header'
import ProfileContent from '@/app/components/features/dashboard/profile-content'
import { UserProfileForm } from '@/app/components/features/user-profile/user-form'
import PasswordForm from '@/app/components/features/user-profile/password-form'
import ProfileCompleteness from '@/app/components/features/user-profile/completeness'

// 导入组件库样式代替Layout.module.css
import modalStyles from '@/app/components/features/dashboard/modal/Modal.module.css'
import profileStyles from '@/app/components/features/dashboard/profile-content/ProfileContent.module.css'
import styles from './dashboard.module.css' // 仅保留特定的样式

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/auth/login')
    },
  })
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  
  // 使用Ref代替直接DOM操作
  const avatarInputRef = useRef<HTMLInputElement>(null)
  
  const { 
    userProfile, 
    isLoading: profileLoading, 
    error: profileError, 
    updateUserProfile, 
    forceRefreshProfile } = useProfile()

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

  // 应用主题
  useEffect(() => {
    if (userProfile?.theme) {
      applyThemeService(userProfile.theme);
    }
  }, [userProfile?.theme]);

  // 处理头像上传点击 - 使用ref代替直接DOM操作
  const handleAvatarClick = () => {
    // 如果ref绑定了头像上传input，则直接触发点击
    if (avatarInputRef.current) {
      avatarInputRef.current.click();
    } else {
      toast.error('无法访问头像上传控件');
    }
  };

  // 设置密码弹窗底部按钮
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

  // 更新头像处理函数
  const handleAvatarChange = async (avatarUrl: string) => {
    try {
      if (userProfile) {
        // 使用转换工具函数生成UserProfileInput
        const profileInput = createProfileUpdate(userProfile, { avatarUrl });
        
        // 调用API更新
        const success = await updateUserProfile(profileInput);
        
        if (success) {
          toast.success('头像已成功更新');
        } else {
          toast.error('头像更新失败');
          // 刷新用户资料而不是刷新整个页面
          forceRefreshProfile();
        }
      }
    } catch (error) {
      console.error('处理头像变更时出错:', error);
      toast.error('更新头像失败，请稍后再试');
    }
  };

  // 加载状态
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

  // 错误状态
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

  // 未登录或没有用户资料
  if (!session?.user || !userProfile) {
    return null
  }

  return (
    <div className={styles.container}>
      <div className={styles.profile}>
        {/* 返回按钮 */}
        <button 
          onClick={() => router.push('/file-management/main')}
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
        
        {/* 个人资料内容 */}
        <ProfileContent 
          session={session}
          userProfile={userProfile}
          isLoading={profileLoading || passwordLoading}
        />
      </div>

      {/* 编辑个人信息弹窗 */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="编辑个人信息"
      >
        <UserProfileForm 
          userProfile={userProfile}
          onUpdate={updateUserProfile}
          onComplete={() => {
            setIsEditModalOpen(false)
            toast.success('个人信息已更新')
          }}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>

      {/* 设置密码弹窗 */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="设置密码"
        footer={renderPasswordFooter()}
      >
        <PasswordForm
          passwordInfo={passwordInfo}
          passwordError={passwordError}
          passwordSuccess={passwordSuccess}
          showPassword={showPassword}
          showConfirmPassword={showConfirmPassword}
          setShowPassword={setShowPassword}
          setShowConfirmPassword={setShowConfirmPassword}
          handlePasswordChange={handlePasswordChange}
          userEmail={session.user.email}
        />
      </Modal>
    </div>
  )
} 