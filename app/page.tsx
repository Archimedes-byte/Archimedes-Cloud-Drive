'use client';

import React, { useRef } from 'react';
import Header from './home/components/Header';
import Hero from './home/components/Hero';
import Features from './home/components/Features';
import CTA from './home/components/CTA';
import Footer from './home/components/Footer';
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