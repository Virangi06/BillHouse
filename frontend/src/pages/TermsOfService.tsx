import React, { useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import GlassCard from '../components/common/GlassCard';

export const TermsOfService: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <MainLayout>
      <div className="min-h-screen bg-cream pt-28 pb-20 font-sans">
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-navy to-green-dark text-white py-16 px-6 lg:px-8 relative overflow-hidden mb-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(47,143,122,0.15),transparent_45%)]"></div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <span className="text-xs font-bold tracking-widest text-green-mint uppercase bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full inline-block mb-4 animate-float-medium">
              Platform Regulations
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
              Terms of Service
            </h1>
            <p className="text-text-secondary text-sm md:text-base max-w-xl mx-auto">
              Last updated: June 15, 2026. Please read our service agreement guidelines for invoicing software use.
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <GlassCard className="p-8 md:p-12 border-navy/5 bg-white shadow-xl flex flex-col gap-8">
            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-navy border-b border-navy/5 pb-2">1. Agreement to Terms</h2>
              <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                By registering, accessing, or utilizing the BillHouse invoicing SaaS application, you agree to comply with and be bound by these Terms of Service. If you are entering into this agreement on behalf of a company or other legal entity, you represent that you have the authority to bind such entity.
              </p>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-navy border-b border-navy/5 pb-2">2. Account Registration and Security</h2>
              <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                To access the dashboard, you must register for an account. You agree to:
              </p>
              <ul className="list-disc pl-6 text-text-secondary text-sm md:text-base flex flex-col gap-2">
                <li>Provide accurate, complete, and updated registration credentials.</li>
                <li>Maintain the secrecy of your login password, tenant keys, and JSON Web Tokens (JWT).</li>
                <li>Promptly notify support of any unauthorized use or security compromise of your business portal.</li>
                <li>Acknowledge that BillHouse uses email validation parameters via mailtrap.io/SendGrid to authenticate registrations.</li>
              </ul>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-navy border-b border-navy/5 pb-2">3. Services and Multi-Tenant Isolation</h2>
              <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                BillHouse grants you a revocable, non-exclusive, non-transferable license to use our invoicing platform. Our systems isolate client lists, tax profiles, and generated invoices within tenant databases. You agree not to attempt unauthorized escalation, breach data boundaries, or inject malicious scripts targeting other tenant nodes.
              </p>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-navy border-b border-navy/5 pb-2">4. Acceptable Platform Use</h2>
              <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                You are solely responsible for the invoice documents and financial statements created and dispatched via the platform. Prohibited activities include:
              </p>
              <ul className="list-disc pl-6 text-text-secondary text-sm md:text-base flex flex-col gap-2">
                <li>Using the automated notification engine to dispatch unsolicited emails (spam reminders) to clients.</li>
                <li>Creating fraudulent invoice declarations or hiding unauthorized services.</li>
                <li>Attempting to bypass access tokens, API endpoints, or platform resource caps.</li>
              </ul>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-navy border-b border-navy/5 pb-2">5. Subscriptions and Fees</h2>
              <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                Certain tiers of BillHouse require subscription fees billed on a recurring monthly or yearly basis. Payments are non-refundable once processed. We reserve the right to modify pricing tiers upon 30 days of direct notification.
              </p>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-navy border-b border-navy/5 pb-2">6. Limitation of Liability</h2>
              <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                To the maximum extent permitted by law, BillHouse shall not be liable for any indirect, incidental, special, exemplary, or consequential damages arising from database disruptions, network downtime, uncollected client invoice payments, or data breaches.
              </p>
            </section>

            <section className="flex flex-col gap-4 bg-cream/40 p-6 rounded-2xl border border-navy/5 text-center">
              <h3 className="text-lg font-bold text-navy">Need Assistance?</h3>
              <p className="text-text-secondary text-sm leading-relaxed mt-1">
                If you have queries or request specific legal clearances, reach out to our legal department.
              </p>
              <p className="text-green-dark font-bold text-sm mt-2">
                Email: legal@billhouse.com
              </p>
            </section>
          </GlassCard>
        </div>
      </div>
    </MainLayout>
  );
};

export default TermsOfService;
