import React, { useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import GlassCard from '../components/common/GlassCard';

export const PrivacyPolicy: React.FC = () => {
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
              Legal Documentation
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
              Privacy Policy
            </h1>
            <p className="text-text-secondary text-sm md:text-base max-w-xl mx-auto">
              Last updated: June 15, 2026. Review how we manage and safeguard your financial and user accounts.
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <GlassCard className="p-8 md:p-12 border-navy/5 bg-white shadow-xl flex flex-col gap-8">
            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-navy border-b border-navy/5 pb-2">1. Information We Collect</h2>
              <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                BillHouse collects personal, corporate, and financial information necessary to provide automated invoicing workflows. This includes:
              </p>
              <ul className="list-disc pl-6 text-text-secondary text-sm md:text-base flex flex-col gap-2">
                <li><strong>Account Registration Details:</strong> Full name, corporate email address, password hash, and tenant identifier.</li>
                <li><strong>Billing Profile Information:</strong> Business registration numbers, tax identifiers (GST/VAT), corporate address, telephone number, and bank account/UPI payment details.</li>
                <li><strong>Client Information:</strong> Names, email addresses, billing addresses, and invoice amounts associated with your clients.</li>
                <li><strong>Transaction Records:</strong> Invoices generated, payment status, reminder logs, and system analytics.</li>
              </ul>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-navy border-b border-navy/5 pb-2">2. How We Use Your Data</h2>
              <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                Your data is exclusively processed to deliver the core SaaS application features. Specifically, we use it for:
              </p>
              <ul className="list-disc pl-6 text-text-secondary text-sm md:text-base flex flex-col gap-2">
                <li>Providing the Multi-Tenant Invoicing system and tracking client balances.</li>
                <li>Sending automated payment notifications and reminders through email services (such as SendGrid or custom SMTP configurations).</li>
                <li>Generating compliance reports, revenue trends, and dashboard metrics.</li>
                <li>Verifying user identity and preventing platform exploitation or fraudulent activity.</li>
              </ul>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-navy border-b border-navy/5 pb-2">3. Multi-Tenant Data Isolation</h2>
              <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                We implement strict multi-tenant architecture logic. Your business profile, client contact sheets, invoices, and accounting history are cryptographically separated from other accounts via your unique tenant ID (UUID). No database query leaks are possible across tenant partitions.
              </p>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-navy border-b border-navy/5 pb-2">4. Third-Party Data Disclosures</h2>
              <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                BillHouse does not sell, lease, or distribute your customer and invoice lists to third-party data brokers. Data sharing is limited to essential sub-processors under strict confidentiality:
              </p>
              <ul className="list-disc pl-6 text-text-secondary text-sm md:text-base flex flex-col gap-2">
                <li><strong>Hosting Infrastructure:</strong> MongoDB Atlas (Database hosting) and Google Cloud / AWS servers.</li>
                <li><strong>Transactional Email Services:</strong> Mailtrap (development testing), SendGrid, or custom SMTP relays.</li>
              </ul>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-navy border-b border-navy/5 pb-2">5. Your Privacy Rights</h2>
              <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                Depending on your jurisdiction, you have specific rights regarding your personal information, including the right to access, rectify, export, or permanently delete your account data. You may trigger these changes by writing to our compliance support.
              </p>
            </section>

            <section className="flex flex-col gap-4 bg-cream/40 p-6 rounded-2xl border border-navy/5">
              <h3 className="text-lg font-bold text-navy">6. Contact Our Compliance Team</h3>
              <p className="text-text-secondary text-sm leading-relaxed mt-1">
                If you have questions about this privacy statement or our multi-tenant data practices, feel free to contact us:
              </p>
              <p className="text-navy font-bold text-sm mt-2">
                Email: privacy@billhouse.com<br />
                Subject: BillHouse Privacy Compliance Inquiry
              </p>
            </section>
          </GlassCard>
        </div>
      </div>
    </MainLayout>
  );
};

export default PrivacyPolicy;
