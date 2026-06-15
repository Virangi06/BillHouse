import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import GlassCard from '../common/GlassCard';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "What is BillHouse?",
    answer: "BillHouse is a modern invoicing SaaS platform designed to help freelancers, consultants, agencies, and SMEs create professional invoices, send them securely, and receive client payments quickly with zero manual tracking."
  },
  {
    question: "Can I generate GST-compliant invoices on BillHouse?",
    answer: "Absolutely! When setting up your business profile, you can configure your GSTIN and tax rates (such as 18% for services). BillHouse automatically calculates SGST/CGST or IGST based on client location during invoice generation."
  },
  {
    question: "How do automated payment reminders work?",
    answer: "Under the Professional tier, BillHouse automatically monitors due dates. If an invoice remains unpaid, the system schedules polite follow-up reminders at Day 7, 14, and 30 to help you secure payments without manual chasing."
  },
  {
    question: "Is my business data secure?",
    answer: "Security is our highest priority. We use strict multi-tenancy logical isolation, meaning your business records are accessible only to authorized accounts in your tenant. Passwords are encrypted using bcrypt and all sessions are secured with JWT authentication."
  },
  {
    question: "What is the billing frequency and cancellation policy?",
    answer: "Our Professional plan is billed monthly at ₹299. You can upgrade, downgrade, or cancel your subscription at any time directly from your settings. There are no lock-in periods or hidden cancellation fees."
  }
];

export const FAQ: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-cream-light border-t border-navy/5">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold tracking-widest text-green uppercase mb-3">FAQ</h2>
          <p className="text-3xl md:text-5xl font-extrabold tracking-tight text-navy">
            Frequently Asked Questions
          </p>
        </div>

        {/* Collapsible Accordion items */}
        <div className="flex flex-col gap-4">
          {faqData.map((faq, idx) => {
            const isOpen = activeIndex === idx;
            return (
              <GlassCard
                key={idx}
                className={`border-navy/5 bg-white shadow-sm overflow-hidden transition-all duration-300 ${
                  isOpen ? 'ring-1 ring-green' : ''
                }`}
              >
                <button
                  onClick={() => toggleAccordion(idx)}
                  className="w-full flex items-center justify-between p-6 text-left font-bold text-navy text-base md:text-lg focus:outline-none"
                >
                  <span>{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-green shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-text-secondary shrink-0" />
                  )}
                </button>
                
                {/* Collapsible panel body */}
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-48 border-t border-navy/5 opacity-100 p-6 bg-cream/20' : 'max-h-0 opacity-0 pointer-events-none'
                  }`}
                >
                  <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
