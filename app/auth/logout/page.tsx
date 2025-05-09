'use client';

import React, { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { message } from 'antd';
import logoutStyles from './logout.module.css';
import Head from 'next/head';

/**
 * 登出页面
 * 
 * 独立的登出页面，处理登出逻辑，避免在其他组件中直接处理登出
 * 导致的Hooks问题
 */
export default function LogoutPage() {
  const fullMessage = "Archimedes' Cloud Drive";
  
  useEffect(() => {
    // 预加载字体
    if ('fonts' in document) {
      // 使用Font Loading API预加载字体
      // @ts-ignore - 类型定义可能缺少
      document.fonts.load('bold 1em "Imperial Script"').then(() => {
        console.log('Imperial Script字体已加载');
      });
    }
    
    const performLogout = async () => {
      try {
        // 显示正在退出消息
        message.loading({
          content: '正在退出登录...',
          key: 'logout',
          duration: 0 // 不自动关闭
        });
        
        // 执行登出操作
        await signOut({ redirect: false });
        
        // 延长展示时间，让用户有足够时间查看退出界面
        setTimeout(() => {
          window.location.replace('/');
        }, 3000);
      } catch (error) {
        console.error('登出过程出错', error);
        message.error({
          content: '退出登录失败，正在返回首页...',
          key: 'logout'
        });
        
        // 出错也强制跳转，但也延长时间
        setTimeout(() => {
          window.location.replace('/');
        }, 2000);
      }
    };
    
    // 页面加载后立即执行登出
    performLogout();
  }, []);
  
  return (
    <>
      <Head>
        {/* 预加载字体链接 */}
        <link 
          rel="preload" 
          href="https://fonts.googleapis.com/css2?family=Imperial+Script&display=swap" 
          as="style" 
        />
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Imperial+Script&display=swap" 
        />
      </Head>
      <div className={logoutStyles.logoutContainer}>
        <div className={logoutStyles.messageContainer}>
          <h2 className={logoutStyles.title}>感谢您的使用</h2>
          <p className={`${logoutStyles.message} ${logoutStyles.writingText}`}>
            {fullMessage}
          </p>
        </div>
      </div>
    </>
  );
} 