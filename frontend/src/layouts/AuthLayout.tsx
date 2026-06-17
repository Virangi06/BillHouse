import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import logo from '../assets/Logo_white.png';
import logoTransparent from '../assets/Logo_transparent.png';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-cream font-sans">
      
      {/* Back to Home floating action (Desktop only) */}
      <div className="hidden lg:block absolute top-6 left-6 z-30">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 border border-navy/15 text-navy hover:bg-navy/5 rounded-xl text-sm font-semibold transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back Home
        </Link>
      </div>

      {/* Left side panel (Desktop Branding) */}
      <div className="hidden lg:flex lg:col-span-5 relative bg-gradient-to-br from-navy to-green-dark text-white p-12 flex-col justify-between overflow-hidden">
        {/* Glow circles */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-green/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-green-mint/5 rounded-full blur-[80px] pointer-events-none"></div>

        {/* Tagline Middle Section */}
        <div className="relative z-10 my-auto">
          <Link to="/" className="inline-block mb-6 relative z-10">
            <img 
              src={logo} 
              alt="BillHouse Logo" 
              className="h-24 w-auto object-contain" 
            />
          </Link>
          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
            Create. Send. <br />
            <span className="text-green-mint">Get Paid.</span>
          </h2>
          <p className="text-text-secondary text-base max-w-sm leading-relaxed">
            The modern, automated invoicing workflow built specifically for freelancers, agencies, and independent professionals.
          </p>
        </div>

        {/* Footer credentials */}
        <div className="relative z-10 flex items-center gap-2.5 text-xs text-text-secondary">
          <ShieldCheck className="h-5 w-5 text-green-mint" />
          <span>Strict Multi-Tenant Encryption Protocol Enabled</span>
        </div>
      </div>

      {/* Right side panel (Auth Form panel) */}
      <div className="col-span-1 lg:col-span-7 flex flex-col items-center justify-center p-4 py-12 sm:p-6 md:p-12 relative overflow-hidden bg-gradient-mesh min-h-screen lg:min-h-0">
        {/* Blur backgrounds */}
        <div className="absolute top-1/4 right-1/4 w-[350px] h-[350px] bg-green-mint/15 rounded-full blur-[100px] pointer-events-none z-0"></div>

        <div className="w-full max-w-md relative z-10 flex flex-col gap-6">
          {/* Mobile Back Button */}
          <div className="flex lg:hidden justify-start">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-navy/15 text-navy hover:bg-navy/5 rounded-xl text-xs font-semibold transition-all duration-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back Home
            </Link>
          </div>

          <div className="text-center lg:text-left">
            {/* Mobile Logo Branding */}
            <div className="flex justify-center lg:hidden mb-6">
              <Link to="/">
                <img 
                  src={logoTransparent} 
                  alt="BillHouse Logo" 
                  className="h-10 w-auto object-contain" 
                />
              </Link>
            </div>
            <h1 className="text-3xl sm:text-2xl lg:text-3xl font-extrabold text-navy tracking-tight">{title}</h1>
            <p className="text-text-secondary text-sm sm:text-xs lg:text-sm font-semibold mt-1.5">{subtitle}</p>
          </div>
          
          {children}
        </div>
      </div>

    </div>
  );
};

export default AuthLayout;
