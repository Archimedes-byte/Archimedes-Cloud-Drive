"use client"

import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from "react"
import { ArrowLeft } from 'lucide-react'

import { useProfile, usePassword, useThemeManager } from '@/app/hooks'
import { useToast } from '@/app/components/features/dashboard/toaster/Toaster'
// 直接导入主题服务，用于特殊情况处理
import { 
  getThemeStyle, 
  applyTheme as applyThemeDirectly, 
  loadThemeFromStorage,
  reinitCustomThemes,
  THEME_STORAGE_KEY
} from '@/app/components/ui/themes'
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
  
  // 使用Ref代替直接DOM操作
  const avatarInputRef = useRef<HTMLInputElement>(null)
  
  const { 
    userProfile, 
    isLoading: profileLoading, 
    error: profileError, 
    updateUserProfile, 
    forceRefreshProfile } = useProfile()

  // 使用主题管理钩子
  const { currentTheme, updateTheme, isLoading: themeLoading } = useThemeManager({
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
          const themeStyle = applyThemeDirectly(storedTheme, false); // 不触发事件，仅应用样式
          
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
    const isCustomTheme = userTheme.startsWith('custom_');
    console.log(`Dashboard页面：主题应用 - 当前主题=${currentTheme}, 用户配置主题=${userTheme}, 是否自定义=${isCustomTheme}`);
    
    // 检查本地存储的主题
    const storedTheme = loadThemeFromStorage();
    const isStoredCustomTheme = storedTheme && storedTheme.startsWith('custom_');
    
    // 优先级调整：
    // 1. 如果本地已存储自定义主题，且当前已手动应用了自定义主题，则保持此状态
    if (isStoredCustomTheme && manualThemeApplied) {
      console.log(`Dashboard页面：保持当前手动应用的自定义主题 ${storedTheme}`);
      return;
    }
    
    // 2. 如果用户配置是自定义主题，应用它
    if (isCustomTheme) {
      // 防止重复应用相同主题
      if (userTheme === currentTheme) {
        console.log(`Dashboard页面：跳过重复应用相同自定义主题 ${userTheme}`);
        return;
      }
      
      console.log(`Dashboard页面：应用用户配置的自定义主题 ${userTheme}`);
      
      // 主题加载与应用
      const applyUserTheme = async () => {
        try {
          // 重新初始化自定义主题，确保内存中有最新数据
          reinitCustomThemes();
          
          // 1. 先尝试通过钩子应用
          const success = await updateTheme(userTheme);
          
          // 2. 如果通过钩子应用失败，尝试直接应用
          if (!success) {
            console.log('Dashboard页面：钩子应用自定义主题失败，尝试直接应用');
            
            // 直接应用主题
            const themeStyle = applyThemeDirectly(userTheme);
            if (themeStyle) {
              console.log('Dashboard页面：直接应用自定义主题成功');
              // 设置标记，表示已手动应用自定义主题
              setManualThemeApplied(true);
              
              // 确保localStorage和body属性都正确设置
              localStorage.setItem(THEME_STORAGE_KEY, userTheme);
              document.body.dataset.theme = userTheme;
            } else {
              console.error('Dashboard页面：直接应用自定义主题失败');
            }
          } else {
            console.log('Dashboard页面：钩子应用自定义主题成功');
            // 设置标记，表示通过钩子成功应用了自定义主题
            setManualThemeApplied(true);
          }
        } catch (error) {
          console.error('Dashboard页面：应用自定义主题失败:', error);
        }
      };
      
      applyUserTheme();
      return;
    }
    
    // 3. 系统主题处理 - 只有在没有已应用的自定义主题时才应用系统主题
    // 检查是否有映射关系，可能是自定义主题映射为系统主题的情况
    try {
      const themeMapping = JSON.parse(localStorage.getItem('theme-id-mapping') || '{}');
      
      // 如果当前系统主题是某个自定义主题的映射，优先应用自定义主题
      if (themeMapping[userTheme]) {
        const originalCustomTheme = themeMapping[userTheme];
        console.log(`Dashboard页面：发现系统主题${userTheme}是自定义主题${originalCustomTheme}的映射，优先应用自定义主题`);
        
        // 确保映射的自定义主题是字符串类型
        if (typeof originalCustomTheme === 'string') {
          // 尝试直接应用自定义主题
          const themeStyle = applyThemeDirectly(originalCustomTheme);
          if (themeStyle) {
            console.log(`Dashboard页面：成功应用映射的自定义主题 ${originalCustomTheme}`);
            setManualThemeApplied(true);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Dashboard页面：检查主题映射失败:', error);
    }
    
    // 如果本地已存储自定义主题，且当前没有应用过自定义主题，检查是否需要应用本地主题
    if (isStoredCustomTheme && !manualThemeApplied && storedTheme) {
      console.log(`Dashboard页面：检测到本地存储的自定义主题 ${storedTheme}，尝试应用`);
      
      // 尝试直接应用本地存储的自定义主题
      const themeStyle = applyThemeDirectly(storedTheme, false);
      if (themeStyle) {
        console.log(`Dashboard页面：成功应用本地存储的自定义主题 ${storedTheme}`);
        document.body.dataset.theme = storedTheme;
        setManualThemeApplied(true);
        return;
      }
    }
    
    // 如果没有自定义主题或自定义主题应用失败，才应用系统主题
    // 防止重复应用相同主题
    if (userTheme === currentTheme) {
      console.log(`Dashboard页面：跳过重复应用相同系统主题 ${userTheme}`);
      return;
    }
    
    // 如果已经手动应用了自定义主题，提示切换到系统主题
    if (manualThemeApplied) {
      console.log(`Dashboard页面：检测到需要切换到系统主题 ${userTheme}，但已手动应用自定义主题，保持自定义主题状态`);
      // 注意：这里不再重置manualThemeApplied，保持自定义主题优先
      return;
    }
    
    console.log(`Dashboard页面：开始应用系统主题 ${userTheme}`);
    
    // 应用系统主题
    updateTheme(userTheme).then(success => {
      if (success) {
        console.log(`Dashboard页面：已应用系统主题 ${userTheme}`);
      } else {
        console.error(`Dashboard页面：应用系统主题 ${userTheme} 失败`);
      }
    });
    
  }, [userProfile?.theme, currentTheme, updateTheme, themeLoading, manualThemeApplied]);
  
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