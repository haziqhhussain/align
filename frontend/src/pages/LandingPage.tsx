import React from 'react';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { Hero } from '../components/landing/Hero';
import { Features } from '../components/landing/Features';
import { HowItWorks } from '../components/landing/HowItWorks';
import { Roles } from '../components/landing/Roles';
import { ProductPreview } from '../components/landing/ProductPreview';
import { Benefits } from '../components/landing/Benefits';
import { CTA } from '../components/landing/CTA';
import { Footer } from '../components/landing/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-theme-bg text-theme-main transition-colors duration-200 selection:bg-theme-primary selection:text-white">
      <LandingNavbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Roles />
        <ProductPreview />
        <Benefits />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};
