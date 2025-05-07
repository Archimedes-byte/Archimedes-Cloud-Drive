'use client';

import React, { useRef, useEffect } from 'react';
import { AppLayout } from '@/app/components/shared/layouts';
import Hero from '@/app/components/features/home/hero';
import Features from '@/app/components/features/home/features';
import CTA from '@/app/components/features/home/cta';
import { useAuth } from '@/app/contexts/auth';

export default function HomePage() {
  const featuresRef = useRef<HTMLDivElement>(null);
  const { openLoginModal } = useAuth();

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    // 为body和html元素添加home-page类，防止主题背景色应用
    document.body.classList.add('home-page');
    document.documentElement.classList.add('home-page');
    
    return () => {
      // 清理函数，移除离开页面时的类名
      document.body.classList.remove('home-page');
      document.documentElement.classList.remove('home-page');
    };
  }, []);

  return (
    <AppLayout onLoginClick={openLoginModal}>
      <main className="main-content home-page">
        <Hero onExploreClick={scrollToFeatures} onLoginClick={openLoginModal} />
        <div ref={featuresRef}>
          <Features id="features" />
        </div>
        <CTA />
      </main>
    </AppLayout>
  );
} 