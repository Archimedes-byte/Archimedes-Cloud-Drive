"use client"

import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from "react"
import { ArrowLeft } from 'lucide-react'

// 导入自定义钩子
import { useProfile } from '@/app/dashboard/hooks/useProfile'
import { usePassword } from '@/app/dashboard/hooks/usePassword'
import { useToast } from './components/Toaster'
import { useValidation } from './hooks/useValidation'
// 导入主题服务
import { applyTheme as applyThemeService } from '@/app/shared/themes'

// 导入组件
import Modal from '@/app/dashboard/components/Modal'
import ProfileHeader from '@/app/dashboard/components/ProfileHeader'
import ProfileContent from '@/app/dashboard/components/ProfileContent'
import EditProfileForm from '@/app/dashboard/components/EditProfileForm'
import PasswordForm from '@/app/dashboard/components/PasswordForm'
import ProfileCompleteness from '@/app/dashboard/components/ProfileCompleteness'
import ThemeSelector from '@/app/dashboard/components/ThemeSelector'

// 导入样式
import styles from './Dashboard.module.css'

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
  
  const { 
    userInfo, 
    setUserInfo, 
    isLoading: profileLoading, 
    error: profileError, 
    updateProfile,
    updateTheme
  } = useProfile()
  
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

  const [isSaving, setIsSaving] = useState(false)
  const toast = useToast()
  const { validateForm } = useValidation()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
    setUserInfo(prev => ({...prev, [field]: e.target.value}))
  }

  const handleSave = async () => {
    try {
      console.log('保存用户资料:', userInfo);
      
      // 表单验证
      if (!validateForm(userInfo)) {
        toast.error('请修正表单中的错误后再提交');
        return;
      }
      
      // 禁用保存按钮，防止重复提交
      setIsSaving(true);
      
      const success = await updateProfile(userInfo);
      
      if (success) {
        setIsEditModalOpen(false);
        // 使用Toast通知替代alert
        toast.success('个人信息已成功保存！');
      } else {
        // 保存失败提示
        toast.error('保存失败，请稍后重试');
      }
    } catch (error) {
      console.error('保存用户资料时出错:', error);
      toast.error('发生错误，请稍后重试');
    } finally {
      // 无论成功还是失败，都重新启用保存按钮
      setIsSaving(false);
    }
  }

  const handlePasswordSave = async () => {
    const success = await updatePassword()
    if (success) {
      setIsPasswordModalOpen(false)
    }
  }

  const openPasswordModal = () => {
    resetPasswordState()
    setIsPasswordModalOpen(true)
  }

  // 应用主题
  useEffect(() => {
    if (userInfo.theme) {
      applyTheme(userInfo.theme);
    }
  }, [userInfo.theme]);

  // 处理主题更改
  const handleThemeChange = async (themeId: string) => {
    // 先立即在本地应用主题，提升用户体验
    applyTheme(themeId);
    
    // 然后尝试在服务器上保存
    try {
      const success = await updateTheme(themeId);
      if (success) {
        console.log(`主题 ${themeId} 已成功应用并保存到服务器`);
      } else {
        console.warn(`主题 ${themeId} 已在本地应用，但未能保存到服务器`);
      }
      return success;
    } catch (error) {
      console.error(`主题 ${themeId} 应用发生错误:`, error);
      // 即使保存失败，本地主题已应用，所以依然返回true让UI保持已选状态
      return true;
    }
  };

  // 将主题应用到文档 - 使用统一的主题服务
  const applyTheme = (theme: string) => {
    applyThemeService(theme);
  };

  // 引用ProfileHeader中的fileInputRef
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 触发头像上传功能
  const handleAvatarClick = () => {
    console.log('资料完整度头像点击被触发');
    
    // 首先尝试使用特定的class查找
    const avatarInput = document.querySelector('.avatar-upload-input');
    if (avatarInput && avatarInput instanceof HTMLInputElement) {
      console.log('通过class找到头像上传input，触发点击');
      avatarInput.click();
      return;
    }
    
    // 备用方案1：通过容器class查找
    const containerInput = document.querySelector('.avatarContainer input[type="file"]');
    if (containerInput && containerInput instanceof HTMLInputElement) {
      console.log('通过容器找到头像上传input，触发点击');
      containerInput.click();
      return;
    }
    
    // 备用方案2：查找所有文件上传input
    console.error('未找到精确的头像上传input元素，尝试查找所有图片上传控件');
    const fileInputs = document.querySelectorAll('input[type="file"]');
    let found = false;
    fileInputs.forEach(input => {
      const fileInput = input as HTMLInputElement;
      if (fileInput.accept && fileInput.accept.includes('image')) {
        console.log('找到备选图片上传input，触发点击');
        fileInput.click();
        found = true;
        return;
      }
    });
    
    if (!found) {
      console.error('无法找到任何图片上传控件');
      alert('无法找到头像上传控件，请尝试直接点击头像进行上传');
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
            onClick={() => window.location.reload()}
            className={styles.retryButton}
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  // 未登录
  if (!session?.user) {
    return null
  }

  // 编辑个人信息弹窗底部按钮
  const renderEditFooter = () => (
    <div className={styles.modalFooterButtons}>
      <button
        onClick={() => setIsEditModalOpen(false)}
        className={styles.cancelButton}
        disabled={isSaving}
      >
        取消
      </button>
      <button
        onClick={handleSave}
        className={styles.saveButton}
        disabled={isSaving}
      >
        {isSaving ? '保存中...' : '保存更改'}
      </button>
    </div>
  );

  // 设置密码弹窗底部按钮
  const renderPasswordFooter = () => (
    <div className={styles.modalFooterButtons}>
      <button
        onClick={() => setIsPasswordModalOpen(false)}
        className={styles.cancelButton}
      >
        取消
      </button>
      <button
        onClick={handlePasswordSave}
        className={styles.saveButton}
        disabled={passwordLoading}
      >
        保存密码
      </button>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.profile}>
        {/* 返回按钮 */}
        <button 
          onClick={() => router.push('/file_management/main')}
          className={styles.backButton}
          title="返回文件管理"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className={styles.profileHeader}>
          {/* 个人资料头部 */}
          <ProfileHeader 
            session={session}
            userInfo={userInfo}
            onEditClick={() => setIsEditModalOpen(true)}
            onPasswordClick={openPasswordModal}
            isLoading={profileLoading || passwordLoading}
            onAvatarChange={async (avatarUrl) => {
              console.log('头像变更被触发，新URL:', avatarUrl);
              
              try {
                // 创建新的userInfo对象
                const updatedInfo = {...userInfo, avatarUrl};
                console.log('更新后的userInfo:', updatedInfo);
                
                // 更新本地状态
                setUserInfo(updatedInfo);
                
                // 保存到数据库并等待完成
                const success = await updateProfile(updatedInfo);
                console.log('保存头像到数据库结果:', success ? '成功' : '失败');
                
                // 如果保存失败，强制重新获取用户数据
                if (!success) {
                  window.location.reload(); // 最后的手段：刷新整个页面
                }
              } catch (error) {
                console.error('处理头像变更时出错:', error);
                alert('更新头像失败，请稍后再试');
              }
            }}
          />
          
          {/* 主题选择器 */}
          <div className={styles.themeSelector}>
            <ThemeSelector 
              currentTheme={userInfo.theme || 'default'} 
              onThemeChange={handleThemeChange}
            />
          </div>
        </div>
        
        {/* 资料完整度 */}
        <ProfileCompleteness 
          userInfo={userInfo} 
          onEditClick={() => setIsEditModalOpen(true)}
          onAvatarClick={handleAvatarClick}
        />
        
        {/* 个人资料内容 */}
        <ProfileContent 
          session={session}
          userInfo={userInfo}
          isLoading={profileLoading || passwordLoading}
        />
      </div>

      {/* 编辑个人信息弹窗 */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="编辑个人信息"
        footer={renderEditFooter()}
      >
        <EditProfileForm 
          userInfo={userInfo}
          onInputChange={handleInputChange}
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