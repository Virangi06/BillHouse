import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, CreditCard } from 'lucide-react';
import invoicePreview from '../../assets/invoice_landing_preview.png';

export const Hero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-mesh">
      {/* Decorative Blur Background Circles */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-mint/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-green/5 rounded-full blur-[80px] pointer-events-none z-0"></div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Left Column: Business copy & Stats */}
          <div className="lg:col-span-6 flex flex-col items-start gap-6 text-left">
            {/* Trusted Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green/10 border border-green/20 shadow-sm animate-float-fast mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse"></span>
              <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-green-dark uppercase">
                Trusted by Freelancers, Agencies & SMEs
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-navy leading-[1.1] mb-2 max-w-xl">
              Organize Billing. <br />
              Empower Cashflow. <br />
              <span className="text-gradient-green">Scale Businesses.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-lg mb-4">
              Generate tax-compliant professional invoices, configure automated overdue email alerts, track outstanding client statements, and view financial analytics on one unified ledger.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md mb-4">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-navy text-white hover:bg-green-dark rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200 active:scale-98 group text-sm shrink-0"
              >
                Start Free
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <a
                href="#pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-navy/15 text-navy hover:bg-navy/5 rounded-xl font-bold transition-all duration-200 active:scale-98 text-sm"
              >
                View Plans
              </a>
            </div>

            {/* Trust Badges */}
            <div className="mt-2 pt-5 border-t border-navy/5 w-full max-w-md flex flex-wrap gap-x-6 gap-y-3 text-text-secondary/50">
              <div className="flex items-center gap-1.5 hover:text-green-dark hover:opacity-100 transition-all duration-200 select-none">
                <ShieldCheck className="h-4.5 w-4.5 text-green" />
                <span className="text-[10px] font-bold uppercase tracking-wider">SSL Secured</span>
              </div>
              <div className="flex items-center gap-1.5 hover:text-green-dark hover:opacity-100 transition-all duration-200 select-none">
                <CreditCard className="h-4.5 w-4.5 text-green" />
                <span className="text-[10px] font-bold uppercase tracking-wider">UPI & Card Ready</span>
              </div>
              <div className="flex items-center gap-1.5 hover:text-green-dark hover:opacity-100 transition-all duration-200 select-none">
                <span className="text-xs font-black text-green leading-none">GST</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Tax Compliant</span>
              </div>
            </div>
          </div>

          {/* Right Column: Premium Invoice Mockup Display */}
          <div className="lg:col-span-6 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-radial from-green-mint/20 to-transparent blur-3xl rounded-full scale-110 pointer-events-none -z-10" />

            <div className="w-full max-w-md bg-white rounded-3xl border border-navy/8 shadow-2xl relative overflow-hidden bg-gradient-soft animate-float-slow">
              {/* Header Browser Bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-navy/5">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#FF5F56] inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-[#FFBD2E] inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-[#27C93F] inline-block"></span>
                </div>
                <div className="px-4 py-0.5 bg-cream rounded-full border border-navy/5 text-[9px] font-mono text-text-secondary select-none font-medium">
                  app.billhouse.com/invoice/INV-2026-004
                </div>
                <div className="w-8"></div>
              </div>

              {/* Invoice Mockup Image */}
              <div className="relative bg-[#f8fafc] w-full aspect-[4/3] overflow-hidden">
                <img
                  src={invoicePreview}
                  alt="BillHouse Premium Invoice Mockup"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                />

                {/* Absolute floating check status */}
                <div className="absolute bottom-4 right-4 bg-emerald-50/95 backdrop-blur-sm border border-emerald-100 rounded-xl p-3 shadow-md flex items-center gap-2 animate-float-medium max-w-[190px]">
                  <span className="flex h-2.5 w-2.5 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green"></span>
                  </span>
                  <div className="text-left">
                    <p className="text-[9px] text-green-dark font-black uppercase tracking-wider">Payment Verified</p>
                    <p className="text-xs font-black text-navy mt-0.5">₹48,200 received</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
