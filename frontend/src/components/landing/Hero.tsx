import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-mesh">
      {/* Decorative Blur Background Circles */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-mint/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-green/5 rounded-full blur-[80px] pointer-events-none z-0"></div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 text-center z-10">
        {/* Trusted Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green/10 border border-green/20 shadow-sm animate-float-fast mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse"></span>
          <span className="text-xs font-semibold tracking-wider text-green-dark uppercase">
            Trusted by Freelancers, Agencies & SMEs
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-navy max-w-4xl mx-auto leading-[1.1] mb-6">
          Create Professional Invoices. <br />
          <span className="text-gradient-green">Get Paid Faster.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed mb-10">
          Generate invoices, send payment reminders, track client payments, and manage your business finances from one simple dashboard.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-navy text-white hover:bg-green-dark rounded-2xl font-bold shadow-md hover:shadow-lg transition-all duration-200 active:scale-98 group text-base"
          >
            Start Free
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>

        </div>
      </div>
    </section>
  );
};

export default Hero;
