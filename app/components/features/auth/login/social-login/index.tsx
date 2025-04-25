'use client';

import React from 'react';
import { GithubOutlined } from '@ant-design/icons';
import { useLogin } from '@/app/hooks/auth';
import styles from './SocialLogin.module.css';
import { Button, Divider } from '@/app/components/ui/ant';

const SocialLogin: React.FC = () => {
  const { isLoading, handleGitHubLogin } = useLogin();
  
  return (
    <>
      <Divider className={styles.divider}>或</Divider>
      
      <Button
        type="default"
        onClick={handleGitHubLogin}
        className={styles.socialButton}
        disabled={isLoading}
        icon={<GithubOutlined />}
      >
        使用 GitHub 登录
      </Button>
    </>
  );
};

export default SocialLogin; 