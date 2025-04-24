'use client';

import React, { useEffect } from 'react';
import { LoginForm, AuthHeader, AuthFooter } from '@/app/components/features/auth';
import styles from '@/app/styles/AuthPages.module.css';

// 为Google对象声明全局类型
declare global {
  interface Window {
    google?: any;
  }
}

export default function Login() {
  // 添加自定义Google登录按钮事件
  useEffect(() => {
    // 等待Google脚本加载完成
    const waitForGoogleScript = setInterval(() => {
      if (window.google && document.getElementById('customGoogleButton')) {
        clearInterval(waitForGoogleScript);
        
        // 点击自定义按钮时触发原始Google按钮点击
        document.getElementById('customGoogleButton')?.addEventListener('click', () => {
          const googleButton = document.querySelector('.g_id_signin [role=button]');
          if (googleButton) {
            (googleButton as HTMLElement).click();
          }
        });
      }
    }, 300);

    return () => clearInterval(waitForGoogleScript);
  }, []);

  return (
    <div className={styles.container}>
      {/* 背景效果 */}
      <div className={styles.backgroundEffects}>
        <div className={`${styles.bgCircle} ${styles.bgCircle1}`}></div>
        <div className={`${styles.bgCircle} ${styles.bgCircle2}`}></div>
        <div className={`${styles.bgCircle} ${styles.bgCircle3}`}></div>
        <div className={styles.bgGradient}></div>
      </div>

      <AuthHeader />

      <main className={styles.content}>
        <div className={styles.loginSection}>
          {/* 登录表单组件 */}
          <LoginForm />
          
          {/* 视觉元素 */}
          <div className={styles.loginVisual}>
            <div className={styles.abstractGraphic}>
              {/* 图形元素 */}
              <div className={styles.graphicElement} data-index="1"></div>
              <div className={styles.graphicElement} data-index="2"></div>
              <div className={styles.graphicElement} data-index="3"></div>
              <div className={styles.graphicElement} data-index="4"></div>
              <div className={styles.graphicElement} data-index="5"></div>
              
              {/* 阴影效果 */}
              <div className={styles.graphicShadow}></div>
              
              {/* 连接线条 */}
              <div className={styles.graphicLines}>
                <svg width="100%" height="100%" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid meet">
                  <path d="M80,200 C150,100 250,90 320,180" stroke="rgba(59, 130, 246, 0.4)" fill="none" strokeWidth="2" />
                  <path d="M100,170 C180,70 240,70 320,170" stroke="rgba(59, 130, 246, 0.3)" fill="none" strokeWidth="1.5" />
                  <path d="M120,230 C180,140 240,140 300,220" stroke="rgba(59, 130, 246, 0.35)" fill="none" strokeWidth="1.5" />
                  <path d="M160,250 C200,200 220,180 260,240" stroke="rgba(99, 102, 241, 0.25)" fill="none" strokeWidth="1.2" />
                  <path d="M180,150 C220,110 240,120 280,160" stroke="rgba(124, 58, 237, 0.2)" fill="none" strokeWidth="1" />
                </svg>
              </div>
              
              {/* 标语文字 */}
              <div className={styles.tagline}>
                <div className={styles.taglineHighlight}>云端存储</div>
                <div className={styles.taglineText}>随时随地，尽在掌握</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AuthFooter />
    </div>
  );
} 