'use client';

import React, { useRef } from 'react';
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

  return (
    <AppLayout onLoginClick={openLoginModal}>
      <main className="main-content">
        <Hero onExploreClick={scrollToFeatures} onLoginClick={openLoginModal} />
        <div ref={featuresRef}>
          <Features id="features" />
        </div>
        <CTA onLoginClick={openLoginModal} />
      </main>
    </AppLayout>
  );
} 