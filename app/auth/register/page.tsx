'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/ant';
import { HomeOutlined } from '@ant-design/icons';
import { RegisterForm } from '@/app/components/features/auth/register';
import registerStyles from '@/app/styles/auth/register/register-page.module.css';
import styles from '@/app/styles/auth/shared.module.css';
import { useAuth } from '@/app/contexts/auth';

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const { openLoginModal } = useAuth();
  
  // 定义返回首页按钮作为额外按钮
  const homeButton = (
    <div className={styles.buttonContainer}>
      <Button 
        type="primary"
        block
        size="large"
        icon={<HomeOutlined />}
        onClick={() => router.push('/')}
        className={styles.registerButton}
      >
        返回首页
      </Button>
    </div>
  );

  return (
    <div className={registerStyles.container}>
      {/* 背景图片 */}
      <div className={registerStyles.bgFull}>
        <Image 
          src="/images/reg_bg_min.jpg"
          alt="注册背景"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
        {/* 左侧文本区域 */}
        <div className={registerStyles.leftContent}>
          <div className={registerStyles.mainText}>用科技</div>
          <div className={registerStyles.subText}>让复杂的世界更简单</div>
          <div className={registerStyles.sloganText}>开启云端之旅，探索无限可能</div>
          <div className={registerStyles.copyright}>© 2025 CloudDrive</div>
        </div>
      </div>

      {/* 表单卡片区域 */}
      <div className={registerStyles.card}>
        <div className={registerStyles.formWrapper}>
          <h1 className={registerStyles.title}>欢迎注册</h1>
          <div className={registerStyles.linkContainer}>
            已有账号？ <a href="#" onClick={(e) => { e.preventDefault(); openLoginModal(); }} className={registerStyles.link}>登录</a>
          </div>

          {/* 使用RegisterForm组件，将返回首页按钮作为extraButtons传递 */}
          <RegisterForm extraButtons={homeButton} />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 