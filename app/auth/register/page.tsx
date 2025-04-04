'use client';

import Link from 'next/link';
import { CloudIcon } from 'lucide-react';
import RegisterForm from './components/RegisterForm';
import styles from '../login/Login.module.css';

export default function Register() {
  return (
    <div className={styles.container}>
      {/* 背景效果 */}
      <div className={styles.backgroundEffects}>
        <div className={`${styles.bgCircle} ${styles.bgCircle1}`}></div>
        <div className={`${styles.bgCircle} ${styles.bgCircle2}`}></div>
        <div className={`${styles.bgCircle} ${styles.bgCircle3}`}></div>
      </div>

      <header className={styles.header}>
        <h1>
          <CloudIcon size={24} className={styles.headerIcon} />
          Archimedes' Cloud Drive
        </h1>
        <nav className={styles.nav}>
          <Link href="/">首页</Link>
          <Link href="/auth/login">登录</Link>
          <Link href="/auth/register">注册</Link>
          <Link href="#">帮助中心</Link>
        </nav>
      </header>

      <main className={styles.content}>
        <div className={styles.loginSection}>
          {/* 注册表单组件 */}
          <RegisterForm />
          
          {/* 视觉元素 */}
          <div className={styles.loginVisual}>
            <div className={styles.abstractGraphic}>
              <div className={styles.graphicElement} data-index="1"></div>
              <div className={styles.graphicElement} data-index="2"></div>
              <div className={styles.graphicElement} data-index="3"></div>
              <div className={styles.graphicElement} data-index="4"></div>
              <div className={styles.graphicElement} data-index="5"></div>
              
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
                <div className={styles.taglineHighlight}>开启云端之旅</div>
                <div className={styles.taglineText}>安全存储，随心所欲</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 