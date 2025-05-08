'use client';

import React from 'react';
import Modal from '@/app/components/features/dashboard/modal';
import LoginForm from '@/app/components/features/auth/login/login-form';
import styles from './modal.module.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 登录模态框组件
 * 
 * 使用统一的登录表单，已内置Github登录和跳转逻辑
 */
const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  return (
    <div className={styles.modalWrapper}>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="欢迎登录CloudDrive"
        className="login-modal-no-decoration"
        footer={null}
      >
        <div className={styles.loginModalContent}>
          <div className={styles.loginForm}>
            <LoginForm />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LoginModal; 