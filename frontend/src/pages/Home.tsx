import React from 'react';
import MainLayout from '../layouts/MainLayout';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import Benefits from '../components/landing/Benefits';
import Testimonials from '../components/landing/Testimonials';
import Pricing from '../components/landing/Pricing';
import FAQ from '../components/landing/FAQ';
import CTABanner from '../components/landing/CTABanner';

export const Home: React.FC = () => {
  return (
    <MainLayout>
      <Hero />
      <Features />
      <Benefits />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTABanner />
    </MainLayout>
  );
};

export default Home;
