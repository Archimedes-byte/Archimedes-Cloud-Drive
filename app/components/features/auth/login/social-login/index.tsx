'use client';

import React from 'react';
import { Github } from 'lucide-react';
import { useLogin } from '@/app/hooks/auth';
import styles from './SocialLogin.module.css';

const SocialLogin: React.FC = () => {
  const { isLoading, handleGitHubLogin } = useLogin();
  
  return (
    <>
      <div className={styles.divider}>或</div>
      
      <button
        type="button"
        onClick={handleGitHubLogin}
        className={styles.socialButton}
        disabled={isLoading}
      >
        <Github size={20} />
        <span>使用 GitHub 登录</span>
      </button>
    </>
  );
};

export default SocialLogin; 