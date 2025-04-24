'use client';

import React, { useRef } from 'react';
import Header from '@/app/components/features/home/header';
import Hero from '@/app/components/features/home/hero';
import Features from '@/app/components/features/home/features';
import CTA from '@/app/components/features/home/cta';
import Footer from '@/app/components/features/home/footer';

export default function HomePage() {
  const featuresRef = useRef<HTMLDivElement>(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="home-page">
      <Header />
      <main className="main-content">
        <Hero onExploreClick={scrollToFeatures} />
        <div ref={featuresRef}>
          <Features id="features" />
        </div>
        <CTA />
      </main>
      <Footer />
    </div>
  );
} 