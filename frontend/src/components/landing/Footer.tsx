import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/Logo_white.png';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-navy text-white pt-20 pb-10 border-t border-white/5 relative z-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Footer Top */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          {/* Logo & Tagline column */}
          <div className="md:col-span-2 flex flex-col items-center md:items-start text-center md:text-left gap-6">
            <Link to="/" onClick={handleScrollTop} className="flex items-center justify-center md:justify-start">
              <img 
                src={logo} 
                alt="BillHouse Logo" 
                className="h-[31px] sm:h-[35px] md:h-[39px] lg:h-[43px] w-auto object-contain" 
              />
            </Link>
            <p className="text-text-secondary text-sm leading-relaxed max-w-sm">
              BillHouse is a modern invoicing SaaS platform designed for freelancers, agencies, and SMEs. Create invoices, automate payment reminders, and secure client cash flows.
            </p>
            <span className="text-xs font-bold text-green-mint uppercase tracking-widest">
              Create. Send. Get Paid.
            </span>
          </div>

          {/* Links Column 1: Product */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-green">Product</h4>
            <ul className="flex flex-col items-center md:items-start gap-2.5 text-sm text-text-secondary">
              <li><a href="#features" className="hover:text-white transition-colors duration-200">Features</a></li>
              <li><a href="#benefits" className="hover:text-white transition-colors duration-200">Invoicing</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors duration-200">Pricing Tiers</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors duration-200">FAQ Help</a></li>
            </ul>
          </div>

          {/* Links Column 2: Legal */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-green">Legal</h4>
            <ul className="flex flex-col items-center md:items-start gap-2.5 text-sm text-text-secondary">
              <li><Link to="/privacy" className="hover:text-white transition-colors duration-200">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors duration-200">Terms of Service</Link></li>
              <li><Link to="/gdpr" className="hover:text-white transition-colors duration-200">GDPR Compliance</Link></li>
              <li><Link to="/security" className="hover:text-white transition-colors duration-200">Security Audit</Link></li>
            </ul>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="border-t border-white/5 pt-8 text-center text-xs text-text-secondary font-medium">
          <p>© {currentYear} BillHouse Technologies Inc. All rights reserved.</p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
