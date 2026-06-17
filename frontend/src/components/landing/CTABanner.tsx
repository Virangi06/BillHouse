import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import GlassCard from '../common/GlassCard';

export const CTABanner: React.FC = () => {
  return (
    <section className="py-10 md:py-16 bg-cream px-6">
      <div className="max-w-6xl mx-auto">
        <GlassCard
          variant="dark"
          className="relative overflow-hidden py-10 px-5 md:py-16 md:px-16 text-center bg-gradient-to-br from-navy to-green-dark border-0 shadow-2xl flex flex-col items-center justify-center"
        >
          {/* Decorative mesh */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-green/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4 md:mb-6 max-w-2xl leading-tight relative z-10">
            Ready to streamline your invoicing?
          </h2>
          <p className="text-sm md:text-base md:text-lg text-green-mint/80 max-w-lg mb-6 md:mb-10 relative z-10">
            Join thousands of independent developers, designers, and small business owners automating their billing processes.
          </p>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 md:px-8 md:py-4 bg-green text-white hover:bg-green-light rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200 active:scale-98 text-sm md:text-base"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 border border-white/20 text-white hover:bg-white/5 rounded-xl font-bold transition-all duration-200 active:scale-98 text-sm md:text-base"
            >
              Sign In to Account
            </Link>
          </div>
        </GlassCard>
      </div>
    </section>
  );
};

export default CTABanner;
