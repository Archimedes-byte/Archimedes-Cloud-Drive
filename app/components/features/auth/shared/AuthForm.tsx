'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/ui/ant';
import { useAuth } from '@/app/contexts/auth';
import { useAuthForm } from '@/app/hooks/auth/useAuthForm';
import { FormStatus } from '@/app/lib/forms/types';
import ErrorMessage from '@/app/components/shared/ErrorMessage';
import AuthFormFields from './AuthFormFields';
import { LoginCredentials, RegisterData } from '@/app/types';
import { validateLoginForm, validateRegisterForm, validatePasswordStrength } from '@/app/utils/validation/auth-validation';
import { AUTH_CONSTANTS } from '@/app/constants/auth';
import styles from '@/app/styles/auth/shared.module.css';
import { 
  getSecureItem, 
  setSecureItem, 
  removeSecureItem, 
  STORAGE_CONFIG 
} from '@/app/utils/storage/secureStorage';

// 认证表单类型
export type AuthFormType = 'login' | 'register';

// 表单属性
export interface AuthFormProps {
  formType: AuthFormType;
  extraButtons?: ReactNode;
  onSuccess?: () => void;
  redirectPath?: string;
  hideNavLinks?: boolean;
}

/**
 * 统一认证表单组件
 * 
 * 处理登录和注册表单逻辑，减少代码重复
 */
const AuthForm: React.FC<AuthFormProps> = ({
  formType,
  extraButtons,
  onSuccess,
  redirectPath,
  hideNavLinks = false
}) => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<FormStatus>(FormStatus.IDLE);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  // 使用统一的认证上下文
  const {
    login,
    register,
    isLoading,
    error,
    clearError,
    setError: setAuthError,
    showSuccessMessage,
    isLoginModalOpen,
    openLoginModal,
    closeLoginModal
  } = useAuth();
  
  // 根据表单类型选择初始值和验证函数
  const initialValues = formType === 'login' 
    ? { email: '', password: '' } as LoginCredentials
    : { name: '', email: '', password: '', confirmPassword: '' } as RegisterData;
  
  const validateForm = formType === 'login' ? validateLoginForm : validateRegisterForm;
  
  // 使用通用表单钩子
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    isValid,
    setSubmitting,
    setFieldValue,
    resetForm
  } = useAuthForm(initialValues, validateForm);
  
  // 检查是否有从注册页面传来的邮箱（仅登录表单）
  useEffect(() => {
    if (formType === 'login' && typeof window !== 'undefined') {
      const fetchEmailFromStorage = async () => {
        const registeredEmail = await getSecureItem(STORAGE_CONFIG.KEYS.REGISTERED_EMAIL);
        if (registeredEmail) {
          setFieldValue('email', registeredEmail);
          await removeSecureItem(STORAGE_CONFIG.KEYS.REGISTERED_EMAIL);
        }
      };
      
      fetchEmailFromStorage();
    }
  }, [formType, setFieldValue]);

  // 组件卸载时清除错误
  useEffect(() => {
    return () => clearError();
  }, [clearError]);
  
  // 注册成功后的处理（仅注册表单）
  useEffect(() => {
    if (formType === 'register' && registrationSuccess) {
      const timer = setTimeout(() => {
        openLoginModal();
        router.push('/');
        setRegistrationSuccess(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [registrationSuccess, openLoginModal, router, formType]);
  
  // 增强密码验证（仅注册表单）
  const validatePasswordComplete = () => {
    if (formType !== 'register') return true;
    
    const passwordErrors = validatePasswordStrength(values.password);
    if (passwordErrors.length > 0) {
      setAuthError(passwordErrors[0]);
      return false;
    }
    return true;
  };
  
  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    // 表单基础验证
    if (!isValid()) {
      const firstError = Object.values(errors)[0];
      if (firstError) {
        setAuthError(firstError);
      }
      return;
    }
    
    // 增强密码验证（仅注册表单）
    if (formType === 'register' && !validatePasswordComplete()) {
      return;
    }
    
    setSubmitting(true);
    setStatus(FormStatus.SUBMITTING);
    
    if (formType === 'login') {
      // 立即关闭登录模态框，提高UI响应速度
      if (closeLoginModal) closeLoginModal();
      
      // 立即进行路由跳转，不等待登录完成
      const targetRoute = redirectPath || AUTH_CONSTANTS.ROUTES.DEFAULT_SUCCESS;
      router.push(targetRoute);
      
      // 在后台处理登录流程
      login(values as LoginCredentials, {
        redirect: false,
        callbackUrl: targetRoute,
        onSuccess: () => {
          setStatus(FormStatus.SUCCESS);
          // 登录成功后不再需要显示模态框中的成功消息，因为已经跳转了
          setTimeout(() => {
            showSuccessMessage('登录成功！');
            
            if (onSuccess) {
              onSuccess();
            }
          }, 10);
        }
      });
    } else {
      // 注册处理 - 优化响应速度
      
      // 立即关闭模态框，提高UI响应速度
      if (closeLoginModal) closeLoginModal();
      
      // 立即进行路由跳转，不等待注册完成
      const targetRoute = '/';  // 注册成功通常返回首页
      router.push(targetRoute);
      
      // 在后台处理注册流程
      register(values as RegisterData, {
        withName: true,
        onSuccess: async () => {
          setStatus(FormStatus.SUCCESS);
          
          // 使用安全存储 - 异步操作
          await setSecureItem(
            STORAGE_CONFIG.KEYS.REGISTERED_EMAIL, 
            (values as RegisterData).email,
            STORAGE_CONFIG.EXPIRATION.SHORT
          );
          
          // 注册成功消息改为在跳转后异步显示
          setTimeout(() => {
            showSuccessMessage('注册成功！点击右上角头像进入登录窗口');
            
            if (onSuccess) {
              onSuccess();
            }
            
            // 不再自动打开登录窗口，让用户主动点击
            setRegistrationSuccess(true);
          }, 10);
          
          resetForm();
        }
      });
    }
    
    setSubmitting(false);
  };
  
  // 导航到另一个认证页面
  const handleNavigate = () => {
    if (closeLoginModal) closeLoginModal();
    router.push(
      formType === 'login' 
        ? AUTH_CONSTANTS.ROUTES.REGISTER 
        : AUTH_CONSTANTS.ROUTES.LOGIN
    );
  };
  
  // 构建表单状态以兼容AuthFormFields组件
  const formState = {
    values,
    errors,
    touched,
    status,
    isSubmitting
  };
  
  return (
    <div className={`${styles.formContainer} ${formType === 'login' ? styles.loginFormContainer : styles.registerFormContainer} ${formType === 'login' ? 'auth-login-container' : 'auth-register-container'}`}>
      {/* 错误信息显示 */}
      {error && (
        <ErrorMessage 
          error={error}
          onClose={clearError}
        />
      )}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* 表单字段 */}
        <AuthFormFields
          formType={formType}
          formState={formState}
          handleChange={handleChange}
          handleBlur={handleBlur}
          isLoading={isLoading || isSubmitting}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
        />
        
        {/* 提交按钮区域 */}
        <div className={`${styles.buttonContainer} ${formType === 'login' ? styles.loginButtonContainer : styles.registerButtonContainer}`}>
          <Button 
            type="default"
            block
            size="large"
            htmlType="submit"
            loading={isSubmitting || isLoading}
            className={formType === 'login' ? styles.loginButton : styles.registerButton}
          >
            {formType === 'login' ? '立即登录' : '立即注册'}
          </Button>
          
          {/* 切换表单类型链接 - 仅在hideNavLinks为false时显示 */}
          {!hideNavLinks && (
            <div className={formType === 'login' ? styles.registerLink : styles.loginLink}>
              {formType === 'login' ? '还没有账户？' : '已有账户？'}
              <Link href={formType === 'login' ? AUTH_CONSTANTS.ROUTES.REGISTER : AUTH_CONSTANTS.ROUTES.LOGIN} 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      handleNavigate(); 
                    }}>
                {formType === 'login' ? '立即注册' : '立即登录'}
              </Link>
            </div>
          )}
          
          {/* 额外按钮 */}
          {extraButtons && (
            <div className={styles.extraButtons}>
              {extraButtons}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default AuthForm; 