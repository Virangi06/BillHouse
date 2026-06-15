import React, { useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import GlassCard from '../components/common/GlassCard';

export const GDPRCompliance: React.FC = () => {
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
              Compliance Standard
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
              GDPR Compliance Statement
            </h1>
            <p className="text-text-secondary text-sm md:text-base max-w-xl mx-auto">
              Last updated: June 15, 2026. How we fulfill our data protection obligations for EU citizens.
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <GlassCard className="p-8 md:p-12 border-navy/5 bg-white shadow-xl flex flex-col gap-8">
            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-navy border-b border-navy/5 pb-2">1. Commitments to GDPR</h2>
              <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                The General Data Protection Regulation (GDPR) regulates how personal data of European Union (EU) citizens is gathered, processed, and secured. BillHouse is committed to strict compliance with GDPR guidelines, ensuring transparency, user autonomy, and cryptographically sound data handling.
              </p>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-navy border-b border-navy/5 pb-2">2. Data Controller vs. Processor Roles</h2>
              <p className="text-text-secondary text-sm md:text-base leading-relaxed font-semibold text-navy">
                Under GDPR terminology, BillHouse operates in two distinct capacities:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                <div className="bg-cream/40 p-5 rounded-xl border border-navy/5 flex flex-col gap-2">
                  <h4 className="font-bold text-navy">BillHouse as a Data Controller</h4>
                  <p className="text-text-secondary text-xs md:text-sm leading-relaxed">
                    We act as a Data Controller for personal data provided directly by our registered workspace administrators (e.g., login credentials, invoicing payment setup, and account billing information).
                  </p>
                </div>
                <div className="bg-cream/40 p-5 rounded-xl border border-navy/5 flex flex-col gap-2">
                  <h4 className="font-bold text-navy">BillHouse as a Data Processor</h4>
                  <p className="text-text-secondary text-xs md:text-sm leading-relaxed">
                    We act as a Data Processor for the records you store inside our platform (e.g., client contact lists, invoice amounts, billing dates, and email reminders). You remain the Data Controller of your client data.
                  </p>
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-navy border-b border-navy/5 pb-2">3. Data Protection Principles</h2>
              <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                We handle all tenant records in accordance with the seven core principles of data protection:
              </p>
              <ul className="list-disc pl-6 text-text-secondary text-sm md:text-base flex flex-col gap-2">
                <li><strong>Lawfulness, fairness, and transparency:</strong> Collected data is only utilized for core billing operations.</li>
                <li><strong>Purpose limitation:</strong> Data is never processed for secondary marketing profiles.</li>
                <li><strong>Data minimization:</strong> We request only the absolute essential inputs during signup and customer additions.</li>
                <li><strong>Accuracy:</strong> Workspace managers can update invoice databases instantaneously.</li>
                <li><strong>Storage limitation:</strong> Records are deleted permanently upon tenant account closure.</li>
                <li><strong>Integrity and confidentiality:</strong> Multi-tenant isolation logic protects records at the database level.</li>
              </ul>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-navy border-b border-navy/5 pb-2">4. Your Rights under GDPR</h2>
              <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                European citizens hold specific rights regarding their personal data. These include:
              </p>
              <ul className="list-disc pl-6 text-text-secondary text-sm md:text-base flex flex-col gap-2">
                <li><strong>Right of Access:</strong> Request a comprehensive export of all personal/billing profiles.</li>
                <li><strong>Right of Rectification:</strong> Edit and correct database profiles within the dashboard.</li>
                <li><strong>Right to Erasure (Right to be Forgotten):</strong> Terminate your tenant workspace to purge all database fields.</li>
                <li><strong>Right of Portability:</strong> Obtain invoice summaries in CSV/JSON structures.</li>
              </ul>
            </section>

            <section className="flex flex-col gap-4 bg-cream/40 p-6 rounded-2xl border border-navy/5">
              <h3 className="text-lg font-bold text-navy">Data Protection Officer</h3>
              <p className="text-text-secondary text-sm leading-relaxed mt-1">
                If you wish to submit a Data Subject Access Request (DSAR) or have questions, contact our DPO:
              </p>
              <p className="text-green-dark font-bold text-sm mt-2">
                Email: dpo@billhouse.com<br />
                Subject: GDPR Compliance / DSAR Request
              </p>
            </section>
          </GlassCard>
        </div>
      </div>
    </MainLayout>
  );
};

export default GDPRCompliance;
