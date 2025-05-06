'use client';

/**
 * 统一认证上下文
 * 
 * 提供集中管理的认证状态，整合身份验证、错误处理和UI交互
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { message } from '@/app/components/ui/ant';
import { AUTH_CONSTANTS } from '@/app/constants/auth';
import authService from '@/app/services/auth-service';
import { LoginCredentials, RegisterData } from '@/app/types';
// 导入登录模态框组件
import { LoginModal } from '@/app/components/features/auth';

// 错误等级
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error'
}

// 认证状态枚举
export enum AuthStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  ERROR = 'error',
  SUCCESS = 'success'
}

// 认证上下文类型
interface AuthContextType {
  // 用户状态
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  authStatus: AuthStatus;
  
  // 认证操作
  login: (credentials: LoginCredentials, options?: any) => Promise<boolean>;
  register: (data: RegisterData, options?: any) => Promise<boolean>;
  logout: (callbackUrl?: string) => Promise<void>;
  
  // 错误处理
  error: string | null;
  setError: (error: string | null, severity?: ErrorSeverity) => void;
  clearError: () => void;
  showErrorMessage: (message: string, severity?: ErrorSeverity) => void;
  showSuccessMessage: (message: string) => void;
  
  // UI状态
  openLoginModal: () => void;
  closeLoginModal: () => void;
  isLoginModalOpen: boolean;
}

// 创建上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者属性
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * 认证上下文提供者
 * 
 * 集中管理认证状态、错误处理和模态框状态
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const { data: session, status: nextAuthStatus } = useSession();
  
  // 认证状态
  const [authStatus, setAuthStatus] = useState<AuthStatus>(AuthStatus.IDLE);
  const [error, setErrorState] = useState<string | null>(null);
  const [errorSeverity, setErrorSeverity] = useState<ErrorSeverity>(ErrorSeverity.ERROR);
  
  // 登录模态框状态
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  
  // 计算派生状态
  const isAuthenticated = nextAuthStatus === 'authenticated';
  const isLoading = nextAuthStatus === 'loading' || authStatus === AuthStatus.LOADING;
  const user = session?.user;
  
  // NextAuth状态变更时更新本地状态
  useEffect(() => {
    if (nextAuthStatus === 'loading') {
      setAuthStatus(AuthStatus.LOADING);
    } else if (nextAuthStatus === 'authenticated') {
      setAuthStatus(AuthStatus.IDLE);
      setErrorState(null);
    }
  }, [nextAuthStatus]);
  
  // 设置错误
  const setError = (errorMessage: string | null, severity = ErrorSeverity.ERROR) => {
    setErrorState(errorMessage);
    setErrorSeverity(severity);
    
    // 移除这里的消息显示，避免与ErrorMessage组件重复显示
    // 错误消息将由ErrorMessage组件统一显示
  };
  
  // 清除错误
  const clearError = () => {
    setErrorState(null);
  };
  
  // 显示错误消息 - 专门用于不通过状态展示的情况
  const showErrorMessage = (msg: string, severity = ErrorSeverity.ERROR) => {
    // 不设置状态，只显示消息
    switch (severity) {
      case ErrorSeverity.INFO:
        message.info(msg);
        break;
      case ErrorSeverity.WARNING:
        message.warning(msg);
        break;
      case ErrorSeverity.ERROR:
        message.error(msg);
        break;
    }
  };
  
  // 显示成功消息
  const showSuccessMessage = (msg: string) => {
    message.success(msg);
  };
  
  // 打开登录模态框
  const openLoginModal = () => {
    setLoginModalOpen(true);
    // 触发自定义事件，方便其他组件获知状态变化
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(AUTH_CONSTANTS.EVENTS.LOGIN_MODAL, { 
        detail: { open: true } 
      }));
    }
  };
  
  // 关闭登录模态框
  const closeLoginModal = () => {
    setLoginModalOpen(false);
    // 触发自定义事件，方便其他组件获知状态变化
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(AUTH_CONSTANTS.EVENTS.LOGIN_MODAL, { 
        detail: { open: false } 
      }));
    }
  };
  
  // 监听自定义事件
  useEffect(() => {
    const handleLoginModalEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.open === 'boolean') {
        setLoginModalOpen(customEvent.detail.open);
      } else {
        // 如果没有详细信息，则切换状态
        setLoginModalOpen(prev => !prev);
      }
    };

    // 添加事件监听器
    window.addEventListener(AUTH_CONSTANTS.EVENTS.LOGIN_MODAL, handleLoginModalEvent);

    // 清理函数
    return () => {
      window.removeEventListener(AUTH_CONSTANTS.EVENTS.LOGIN_MODAL, handleLoginModalEvent);
    };
  }, []);
  
  // 登录方法
  const login = async (
    credentials: LoginCredentials, 
    options?: { 
      redirect?: boolean;
      callbackUrl?: string;
      onSuccess?: () => void;
      onError?: (error: string) => void;
    }
  ): Promise<boolean> => {
    try {
      setAuthStatus(AuthStatus.LOADING);
      clearError();
      
      const result = await authService.login(credentials, {
        ...options,
        onSuccess: () => {
          setAuthStatus(AuthStatus.SUCCESS);
          
          if (options?.onSuccess) {
            options.onSuccess();
          }
        },
        onError: (errorMsg) => {
          setError(errorMsg);
          setAuthStatus(AuthStatus.ERROR);
          
          if (options?.onError) {
            options.onError(errorMsg);
          }
        }
      });
      
      return result.success;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '登录失败';
      setError(errorMsg);
      setAuthStatus(AuthStatus.ERROR);
      
      if (options?.onError) {
        options.onError(errorMsg);
      }
      
      return false;
    }
  };
  
  // 注册方法
  const register = async (
    data: RegisterData, 
    options?: {
      withName?: boolean;
      onSuccess?: () => void;
      onError?: (error: string) => void;
    }
  ): Promise<boolean> => {
    try {
      setAuthStatus(AuthStatus.LOADING);
      clearError();
      
      const result = await authService.register({
        email: data.email,
        password: data.password,
        name: options?.withName ? data.name : undefined,
      }, {
        onSuccess: () => {
          setAuthStatus(AuthStatus.SUCCESS);
          
          if (options?.onSuccess) {
            options.onSuccess();
          }
        },
        onError: (errorMsg) => {
          setError(errorMsg);
          setAuthStatus(AuthStatus.ERROR);
          
          if (options?.onError) {
            options.onError(errorMsg);
          }
        }
      });
      
      return result.success;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '注册失败';
      setError(errorMsg);
      setAuthStatus(AuthStatus.ERROR);
      
      if (options?.onError) {
        options.onError(errorMsg);
      }
      
      return false;
    }
  };
  
  // 登出方法
  const logout = async (callbackUrl?: string): Promise<void> => {
    try {
      setAuthStatus(AuthStatus.LOADING);
      // 使用authService的logout方法，传递回调URL
      await authService.logout({ 
        redirect: true,
        callbackUrl: callbackUrl || AUTH_CONSTANTS.ROUTES.LOGOUT // 使用登出页面而非直接跳转到登录页
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '登出失败';
      setError(errorMsg);
      setAuthStatus(AuthStatus.ERROR);
      // 发生错误时仍然尝试重定向到登出页面
      if (typeof window !== 'undefined') {
        window.location.href = AUTH_CONSTANTS.ROUTES.LOGOUT;
      }
    }
  };
  
  // 上下文值
  const contextValue: AuthContextType = {
    // 用户状态
    user,
    isAuthenticated,
    isLoading,
    authStatus,
    
    // 认证操作
    login,
    register,
    logout,
    
    // 错误处理
    error,
    setError,
    clearError,
    showErrorMessage,
    showSuccessMessage,
    
    // UI状态
    openLoginModal,
    closeLoginModal,
    isLoginModalOpen
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
    </AuthContext.Provider>
  );
}

/**
 * 使用认证上下文的Hook
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  
  return context;
} 