'use client';

import React, { useRef } from 'react';
import Header from '@/app/components/features/home/header';
import Hero from '@/app/components/features/home/hero';
import Features from '@/app/components/features/home/features';
import CTA from '@/app/components/features/home/cta';
import Footer from '@/app/components/features/home/footer';
import styles from './home/Home.module.css';

export default function HomePage() {
  const featuresRef = useRef<HTMLDivElement>(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={styles.homePage}>
      <Header />
      <main className={styles.main}>
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