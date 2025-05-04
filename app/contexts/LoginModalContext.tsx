'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { LoginModal } from '@/app/components/features/auth/login';
import { AUTH_CONSTANTS } from '@/app/constants/auth';

// 定义上下文类型
interface LoginModalContextType {
  isOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

// 创建上下文
const LoginModalContext = createContext<LoginModalContextType | undefined>(undefined);

// 提供者组件
export function LoginModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  // 监听自定义事件
  useEffect(() => {
    const handleLoginModalEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.open === 'boolean') {
        setIsOpen(customEvent.detail.open);
      } else {
        // 如果没有详细信息，则切换状态
        setIsOpen(prev => !prev);
      }
    };

    // 添加事件监听器
    window.addEventListener(AUTH_CONSTANTS.EVENTS.LOGIN_MODAL, handleLoginModalEvent);

    // 清理函数
    return () => {
      window.removeEventListener(AUTH_CONSTANTS.EVENTS.LOGIN_MODAL, handleLoginModalEvent);
    };
  }, []);

  // 打开模态框
  const openLoginModal = () => {
    setIsOpen(true);
  };

  // 关闭模态框
  const closeLoginModal = () => {
    setIsOpen(false);
  };

  return (
    <LoginModalContext.Provider value={{ isOpen, openLoginModal, closeLoginModal }}>
      {children}
      <LoginModal isOpen={isOpen} onClose={closeLoginModal} />
    </LoginModalContext.Provider>
  );
}

// 自定义hook便于使用
export function useLoginModal() {
  const context = useContext(LoginModalContext);
  if (context === undefined) {
    throw new Error('useLoginModal必须在LoginModalProvider内部使用');
  }
  return context;
} 