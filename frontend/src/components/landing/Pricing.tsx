import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import GlassCard from '../common/GlassCard';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: PlanFeature[];
  ctaText: string;
  ctaLink: string;
  isPopular: boolean;
  variant: 'light' | 'mint' | 'dark';
}

const plans: PricingPlan[] = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Perfect for freelancers starting their independent journey.",
    features: [
      { text: "Unlimited invoices", included: true },
      { text: "Up to 10 active clients", included: true },
      { text: "Standard invoice templates", included: true },
      { text: "GST tax calculations", included: true },
      { text: "Automated reminders", included: false },
      { text: "Advanced reports & charts", included: false },
    ],
    ctaText: "Get Started Free",
    ctaLink: "/register",
    isPopular: false,
    variant: "light",
  },
  {
    name: "Professional",
    price: "₹299",
    period: "month",
    description: "For established creators, agencies, and small businesses.",
    features: [
      { text: "Unlimited invoices", included: true },
      { text: "Unlimited active clients", included: true },
      { text: "Premium templates & branding", included: true },
      { text: "GST & TDS compliance summaries", included: true },
      { text: "Automated email reminders", included: true },
      { text: "Comprehensive financial reports", included: true },
    ],
    ctaText: "Start Free Trial",
    ctaLink: "/register",
    isPopular: true,
    variant: "dark",
  },
  {
    name: "Growth / Agency",
    price: "₹999",
    period: "month",
    description: "For scaling agencies, teams, and high-volume operators.",
    features: [
      { text: "Unlimited invoices & clients", included: true },
      { text: "Custom email sending domains", included: true },
      { text: "Multi-user team access", included: true },
      { text: "Automated payment schedules", included: true },
      { text: "Dedicated API logs & webhooks", included: true },
      { text: "Priority 24/7 support agent", included: true },
    ],
    ctaText: "Start Growth Trial",
    ctaLink: "/register",
    isPopular: false,
    variant: "mint",
  }
];

export const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="py-24 bg-cream overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-bold tracking-widest text-green uppercase mb-3">Pricing Plans</h2>
          <p className="text-3xl md:text-5xl font-extrabold tracking-tight text-navy">
            Fair, transparent pricing for any business scale
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8 max-w-7xl mx-auto items-stretch">
          {plans.map((plan, idx) => (
            <GlassCard
              key={idx}
              variant={plan.variant}
              className={`p-5 sm:p-8 md:p-10 flex flex-col justify-between relative border-navy/10 ${
                plan.isPopular 
                  ? 'ring-2 ring-green shadow-xl scale-100 lg:scale-105 z-10' 
                  : 'shadow-md scale-100 z-0'
              }`}
            >
              {/* Most Popular Badge */}
              {plan.isPopular && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green text-cream font-bold text-xs uppercase px-4 py-1.5 rounded-full tracking-wider shadow">
                  Most Popular
                </span>
              )}

              <div>
                {/* Plan Header */}
                <div className="mb-4 md:mb-6">
                  <h3 className="text-lg md:text-xl font-bold uppercase tracking-wider mb-1.5 md:mb-2">{plan.name}</h3>
                  <p className="text-xs opacity-70 mb-3 md:mb-4">{plan.description}</p>
                  <div className="flex items-baseline">
                    <span className="text-4xl md:text-5xl font-extrabold">{plan.price}</span>
                    <span className="text-sm font-medium ml-1">/{plan.period}</span>
                  </div>
                </div>

                <hr className={`border-t mb-5 md:mb-8 ${plan.variant === 'dark' ? 'border-white/10' : 'border-navy/5'}`} />

                {/* Features List */}
                <ul className="flex flex-col gap-2.5 md:gap-4 mb-6 md:mb-8">
                  {plan.features.map((feat, fIdx) => (
                    <li 
                      key={fIdx} 
                      className={`flex items-center gap-3 text-sm ${
                        !feat.included ? 'opacity-40 line-through' : ''
                      }`}
                    >
                      <Check className={`h-4.5 w-4.5 shrink-0 ${
                        feat.included 
                          ? plan.variant === 'dark' ? 'text-green-mint' : 'text-green'
                          : 'text-text-secondary'
                      }`} />
                      <span>{feat.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <Link
                to={plan.ctaLink}
                className={`w-full text-center py-3 md:py-4 rounded-xl font-bold transition-all duration-200 active:scale-98 text-sm md:text-base ${
                  plan.isPopular
                    ? 'bg-green text-white hover:bg-green-light shadow-md'
                    : 'bg-navy text-white hover:bg-green-dark shadow'
                }`}
              >
                {plan.ctaText}
              </Link>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
