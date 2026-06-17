import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/Logo_transparent.png';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setIsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-cream/80 backdrop-blur-md border-b border-navy/5 py-2.5 lg:py-4 shadow-sm'
        : 'bg-transparent py-3.5 lg:py-5'
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Left Section: Logo */}
          <div className="flex items-center justify-start flex-1 min-w-[180px] shrink-0">
            <Link to="/" className="flex items-center group">
              <img
                src={logo}
                alt="BillHouse Logo"
                className="h-10 md:h-12 lg:h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </Link>
          </div>

          {/* Center Section: Navigation Links */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <div className="flex items-center gap-8">
              <button
                onClick={() => scrollToSection('features')}
                className="text-sm font-medium text-text-secondary hover:text-navy transition-colors duration-200"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('benefits')}
                className="text-sm font-medium text-text-secondary hover:text-navy transition-colors duration-200"
              >
                Invoicing
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-sm font-medium text-text-secondary hover:text-navy transition-colors duration-200"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="text-sm font-medium text-text-secondary hover:text-navy transition-colors duration-200"
              >
                Resources
              </button>
            </div>
          </div>

          {/* Right Section: CTA & Menu Toggle */}
          <div className="flex items-center justify-end flex-1 min-w-[180px] shrink-0 gap-4">
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="text-sm font-semibold text-navy hover:text-green-dark transition-colors duration-200"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="text-sm font-medium px-4 py-2 border border-navy/15 text-navy hover:bg-navy/5 rounded-xl transition-all duration-200"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-semibold text-text-secondary hover:text-navy transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-semibold px-5 py-2.5 bg-navy text-white hover:bg-green-dark rounded-xl shadow-sm hover:shadow transition-all duration-200 active:scale-98"
                  >
                    Start Free
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-text-secondary hover:text-navy focus:outline-none"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="py-4 px-2 bg-cream-dark/95 backdrop-blur-lg rounded-2xl border border-navy/5 shadow-lg flex flex-col gap-2">
            <button
              onClick={() => scrollToSection('features')}
              className="text-left px-4 py-3 text-base font-semibold text-text-secondary hover:text-navy rounded-xl transition-colors duration-200 hover:bg-navy/5"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('benefits')}
              className="text-left px-4 py-3 text-base font-semibold text-text-secondary hover:text-navy rounded-xl transition-colors duration-200 hover:bg-navy/5"
            >
              Invoicing
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-left px-4 py-3 text-base font-semibold text-text-secondary hover:text-navy rounded-xl transition-colors duration-200 hover:bg-navy/5"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-left px-4 py-3 text-base font-semibold text-text-secondary hover:text-navy rounded-xl transition-colors duration-200 hover:bg-navy/5"
            >
              Resources
            </button>
            <hr className="border-navy/5 my-2" />
            <div className="flex flex-col gap-3 px-4 pb-2">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="w-full text-center py-3.5 bg-green text-white hover:bg-green-dark rounded-xl shadow-sm font-bold text-base transition-all duration-200 active:scale-98"
                    onClick={() => setIsOpen(false)}
                  >
                    Go to Dashboard
                  </Link>
                  <button
                    onClick={() => { logout(); setIsOpen(false); }}
                    className="w-full text-center py-3 border border-navy/15 text-navy hover:bg-navy/5 rounded-xl font-semibold text-base transition-all duration-200 active:scale-98"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="w-full text-center py-3 border border-navy/15 text-navy hover:bg-navy/5 rounded-xl font-semibold text-base transition-all duration-200 active:scale-98"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="w-full text-center py-3.5 bg-navy text-white hover:bg-green-dark rounded-xl shadow-md font-bold text-base transition-all duration-200 active:scale-98"
                    onClick={() => setIsOpen(false)}
                  >
                    Start Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
