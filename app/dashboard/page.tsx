"use client"

import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from "react"
import { ArrowLeft } from 'lucide-react'

// 导入自定义钩子
import { useProfile } from '@/dashboard/hooks/useProfile'
import { usePassword } from '@/dashboard/hooks/usePassword'

// 导入组件
import Modal from '@/dashboard/components/Modal'
import ProfileHeader from '@/dashboard/components/ProfileHeader'
import ProfileContent from '@/dashboard/components/ProfileContent'
import EditProfileForm from '@/dashboard/components/EditProfileForm'
import PasswordForm from '@/dashboard/components/PasswordForm'
import ProfileCompleteness from '@/dashboard/components/ProfileCompleteness'
import ThemeSelector from '@/dashboard/components/ThemeSelector'

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
    setUserInfo(prev => ({...prev, [field]: e.target.value}))
  }

  const handleSave = async () => {
    const success = await updateProfile(userInfo)
    if (success) {
      setIsEditModalOpen(false)
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

  // 将主题应用到文档
  const applyTheme = (theme: string) => {
    const themes = {
      // 基础色彩主题
      default: {
        primary: '#3b82f6',
        secondary: '#3b98f5',
        accent: '#60a5fa',
        background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f0fd 100%)'
      },
      violet: {
        primary: '#8b5cf6',
        secondary: '#a855f7',
        accent: '#c4b5fd',
        background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)'
      },
      emerald: {
        primary: '#10b981',
        secondary: '#059669',
        accent: '#6ee7b7',
        background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
      },
      amber: {
        primary: '#f59e0b',
        secondary: '#d97706',
        accent: '#fcd34d',
        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
      },
      rose: {
        primary: '#f43f5e',
        secondary: '#e11d48',
        accent: '#fda4af',
        background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)'
      },
      
      // 渐变主题
      ocean: {
        primary: '#0ea5e9',
        secondary: '#0284c7',
        accent: '#38bdf8',
        background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)'
      },
      sunset: {
        primary: '#f97316',
        secondary: '#ea580c',
        accent: '#fb923c',
        background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)'
      },
      forest: {
        primary: '#16a34a',
        secondary: '#15803d',
        accent: '#22c55e',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
      },
      galaxy: {
        primary: '#6366f1',
        secondary: '#4f46e5',
        accent: '#818cf8',
        background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)'
      },
      
      // 季节主题
      spring: {
        primary: '#ec4899',
        secondary: '#db2777',
        accent: '#f472b6',
        background: 'linear-gradient(135deg, #fdf2f8 0%, #fbcfe8 100%)'
      },
      summer: {
        primary: '#eab308',
        secondary: '#ca8a04',
        accent: '#facc15',
        background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)'
      },
      autumn: {
        primary: '#b45309',
        secondary: '#92400e',
        accent: '#f59e0b',
        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
      },
      winter: {
        primary: '#0369a1',
        secondary: '#075985',
        accent: '#38bdf8',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
      },
      
      // 柔和主题 - 浅色系列
      pastel_pink: {
        primary: '#f9a8d4',
        secondary: '#ec4899',
        accent: '#fbcfe8',
        background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)'
      },
      pastel_blue: {
        primary: '#93c5fd',
        secondary: '#60a5fa',
        accent: '#bfdbfe',
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
      },
      pastel_lavender: {
        primary: '#c4b5fd',
        secondary: '#a78bfa',
        accent: '#ddd6fe',
        background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)'
      },
      pastel_mint: {
        primary: '#6ee7b7',
        secondary: '#34d399',
        accent: '#a7f3d0',
        background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
      },
      pastel_peach: {
        primary: '#fda4af',
        secondary: '#fb7185',
        accent: '#fecdd3',
        background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)'
      },
      pastel_lemon: {
        primary: '#fde68a',
        secondary: '#fcd34d',
        accent: '#fef3c7',
        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
      },
      pastel_teal: {
        primary: '#5eead4',
        secondary: '#2dd4bf',
        accent: '#99f6e4',
        background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)'
      }
    };
    
    const selectedTheme = themes[theme as keyof typeof themes] || themes.default;
    
    document.documentElement.style.setProperty('--theme-primary', selectedTheme.primary);
    document.documentElement.style.setProperty('--theme-secondary', selectedTheme.secondary);
    document.documentElement.style.setProperty('--theme-accent', selectedTheme.accent);
    document.documentElement.style.setProperty('--theme-background', selectedTheme.background);
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
      >
        取消
      </button>
      <button
        onClick={handleSave}
        className={styles.saveButton}
      >
        保存更改
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
              onThemeChange={updateTheme} 
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