import React from 'react';
import { ShieldCheck, Zap, Heart } from 'lucide-react';

export const Benefits: React.FC = () => {
  return (
    <section id="benefits" className="py-24 bg-cream-light border-t border-navy/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column: Visual graphic mockup stub */}
          <div className="relative">
            {/* Background elements */}
            <div className="absolute -top-12 -left-12 w-72 h-72 bg-green-mint/20 rounded-full blur-[80px] z-0"></div>
            
            {/* Real aesthetic dashboard card preview */}
            <div className="relative z-10 p-6 sm:p-8 rounded-3xl bg-white border border-navy/5 shadow-xl flex flex-col gap-6">
              <div className="flex justify-between items-center pb-4 border-b border-navy/5">
                <div>
                  <h4 className="font-bold text-navy text-sm">Monthly Retainer</h4>
                  <p className="text-xs text-text-secondary">Client: Acme Corporation</p>
                </div>
                <span className="px-2.5 py-1 bg-green-mint/30 text-green-dark text-xs font-bold rounded-full">
                  Automated
                </span>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary font-medium">Subtotal:</span>
                  <span className="text-navy font-bold">₹40,000.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary font-medium">GST (18%):</span>
                  <span className="text-navy font-bold">₹7,200.00</span>
                </div>
                <hr className="border-navy/5" />
                <div className="flex justify-between text-base">
                  <span className="text-navy font-bold">Total:</span>
                  <span className="text-green font-extrabold">₹47,200.00</span>
                </div>
              </div>

              <div className="p-4 bg-green/5 rounded-2xl border border-green/10 flex items-start gap-3">
                <Zap className="h-5 w-5 text-green mt-0.5 shrink-0" />
                <div>
                  <h5 className="text-xs font-bold text-green-dark">Smart Recommendation</h5>
                  <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                    This client usually pays via UPI on the 5th of the month. A reminder is scheduled for June 4th.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed benefit items */}
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="text-sm font-bold tracking-widest text-green uppercase mb-3">Why BillHouse</h2>
              <p className="text-3xl md:text-5xl font-extrabold tracking-tight text-navy leading-tight">
                Built to elevate your business operations
              </p>
            </div>

            <div className="flex flex-col gap-6">
              {/* Benefit item 1 */}
              <div className="flex gap-4">
                <div className="p-3 bg-green/10 text-green rounded-2xl h-fit shrink-0">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-navy mb-1">Save 10+ hours every month</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    Stop drafting invoices manually in Word or Excel. Use structured records and automatic tax calculations to generate error-free billing templates in seconds.
                  </p>
                </div>
              </div>

              {/* Benefit item 2 */}
              <div className="flex gap-4">
                <div className="p-3 bg-green/10 text-green rounded-2xl h-fit shrink-0">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-navy mb-1">Establish Professional Authority</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    Impress your clients with clean, branded invoices featuring your custom logo, payment details, and structured breakdowns. Build trust with immediate payment receipts.
                  </p>
                </div>
              </div>

              {/* Benefit item 3 */}
              <div className="flex gap-4">
                <div className="p-3 bg-green/10 text-green rounded-2xl h-fit shrink-0">
                  <Heart className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-navy mb-1">Never miss another payment</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    Real-time dashboard notifications show you exactly when an invoice is opened, viewed, or paid. Quietly automate client follow-ups without manual reminders.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Benefits;
