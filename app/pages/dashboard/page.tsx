"use client"

import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from "react"
import { ArrowLeft } from 'lucide-react'

import { useProfile, usePassword, useThemeManager } from '@/app/hooks'
import { useToast } from '@/app/components/features/dashboard/toaster/Toaster'
// 直接导入主题服务，用于特殊情况处理
import { 
  // getThemeStyle, 
  applyTheme as applyThemeDirectly, 
  loadThemeFromStorage,
  reinitCustomThemes,
  THEME_STORAGE_KEY
} from '@/app/theme'
import { createProfileUpdate } from '@/app/utils/user/profile'

// 导入组件
import Modal from '@/app/components/features/dashboard/modal'
import ProfileHeader from '@/app/components/features/user-profile/profile-header'
import ProfileContent from '@/app/components/features/dashboard/profile-content'
import { UserProfileForm } from '@/app/components/features/user-profile/user-form'
import PasswordForm from '@/app/components/features/user-profile/password-form'
import ProfileCompleteness from '@/app/components/features/user-profile/completeness'

import modalStyles from '@/app/components/features/dashboard/modal/Modal.module.css'
import styles from './dashboard.module.css' 

// import {
//   useTheme,
//   ThemePanel
// } from '@/app/theme'

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
  const [manualThemeApplied, setManualThemeApplied] = useState(false)
  // const [dashboardTheme, setDashboardTheme] = useState<string | null>(null)
  
  // 使用Ref代替直接DOM操作
  const avatarInputRef = useRef<HTMLInputElement>(null)
  
  const { 
    userProfile, 
    isLoading: profileLoading, 
    error: profileError, 
    updateUserProfile, 
    forceRefreshProfile } = useProfile()

  // 使用主题管理钩子
  const { /* currentTheme, */ updateTheme, isLoading: themeLoading } = useThemeManager({
    userTheme: userProfile?.theme || null
  });

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

  // 页面初次加载时，确保自定义主题已正确初始化
  useEffect(() => {
    const initializeThemes = async () => {
      try {
        // 重新初始化自定义主题，确保数据同步最新
        const themesCount = reinitCustomThemes();
        console.log(`Dashboard页面：初始化自定义主题，找到${themesCount}个自定义主题`);
        
        // 检查localStorage是否有自定义主题
        const storedTheme = loadThemeFromStorage();
        console.log(`Dashboard页面：本地存储的主题=${storedTheme}`);
        
        // 检查是否需要直接应用本地存储的自定义主题
        if (storedTheme && storedTheme.startsWith('custom_') && !manualThemeApplied) {
          console.log(`Dashboard页面：尝试直接应用本地存储的自定义主题 ${storedTheme}`);
          
          // 尝试直接应用主题
          const themeStyle = applyThemeDirectly(storedTheme); // 应用样式
          
          if (themeStyle) {
            console.log(`Dashboard页面：成功直接应用自定义主题 ${storedTheme}`);
            document.body.dataset.theme = storedTheme;
            setManualThemeApplied(true);
          } else {
            console.error(`Dashboard页面：无法直接应用自定义主题 ${storedTheme}`);
          }
        }
      } catch (error) {
        console.error('Dashboard页面：初始化主题时出错', error);
      }
    };
    
    initializeThemes();
  }, [manualThemeApplied]);

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

  // 主题初始化与应用
  useEffect(() => {
    if (!userProfile?.theme || themeLoading) return;
    
    // 确保theme是字符串
    const userTheme = userProfile.theme as string;
    console.log(`Dashboard页面：主题初始化 - 用户配置主题=${userTheme}`);
    
    // 检查本地存储的主题
    const storedTheme = loadThemeFromStorage();
    
    // 优先级调整：
    // 1. 用户数据库中的主题优先级最高
    if (userTheme) {
      console.log(`Dashboard页面：应用用户数据库中的主题 ${userTheme}`);
      
      // 尝试应用主题
      try {
        // 如果是自定义主题，确保先重新初始化
        if (userTheme.startsWith('custom_')) {
          reinitCustomThemes();
        }
        
        // 应用主题
        const themeStyle = applyThemeDirectly(userTheme);
        if (themeStyle) {
          // setDashboardTheme(userTheme); // 已弃用
          console.log(`Dashboard页面：成功应用主题 ${userTheme}`);
          
          // 确保记录主题到localStorage和body属性
          localStorage.setItem(THEME_STORAGE_KEY, userTheme);
          document.body.dataset.theme = userTheme;
        } else {
          console.error(`Dashboard页面：应用主题 ${userTheme} 失败`);
          
          // 如果主题应用失败，尝试使用默认主题
          // setDashboardTheme('default'); // 已弃用
          applyThemeDirectly('default');
          // setDashboardTheme('default'); // 已弃用
        }
      } catch (error) {
        console.error('Dashboard页面：应用主题出错:', error);
      }
    } 
    // 2. 如果用户数据库中没有主题，但本地存储中有，使用本地存储的主题
    else if (storedTheme) {
      console.log(`Dashboard页面：使用本地存储的主题 ${storedTheme}`);
      
      // 尝试应用主题并保存到数据库
      try {
        const themeStyle = applyThemeDirectly(storedTheme);
        if (themeStyle) {
          // setDashboardTheme(storedTheme); // 已弃用
          console.log(`Dashboard页面：成功应用本地存储的主题 ${storedTheme}`);
          
          // 保存主题到用户数据库
          updateTheme(storedTheme).then(success => {
            if (success) {
              console.log(`Dashboard页面：本地主题 ${storedTheme} 已同步到数据库`);
            } else {
              console.warn(`Dashboard页面：本地主题 ${storedTheme} 同步到数据库失败`);
            }
          });
        }
      } catch (error) {
        console.error('Dashboard页面：应用本地主题出错:', error);
      }
    }
    // 3. 如果用户数据库和本地存储都没有主题，使用默认主题
    else {
      console.log('Dashboard页面：没有找到用户主题设置，使用默认主题');
      applyThemeDirectly('default');
      // setDashboardTheme('default'); // 已弃用
    }
  }, [userProfile?.theme, updateTheme, themeLoading]);
  
  // 页面加载时，确保文档主题类处于正确状态
  useEffect(() => {
    if (typeof document !== 'undefined' && userProfile?.theme) {
      // 确保body上有data-theme属性
      if (!document.body.dataset.theme && userProfile.theme) {
        document.body.dataset.theme = userProfile.theme;
        console.log(`Dashboard页面：设置body[data-theme]=${userProfile.theme}`);
      }
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