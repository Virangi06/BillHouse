import React, { useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import GlassCard from '../components/common/GlassCard';

export const SecurityAudit: React.FC = () => {
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
              Architecture Report
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
              Security Audit & Infrastructure
            </h1>
            <p className="text-text-secondary text-sm md:text-base max-w-xl mx-auto">
              Last updated: June 15, 2026. Insights into our cryptographic isolation, authentication, and hosting protocols.
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <GlassCard className="p-8 md:p-12 border-navy/5 bg-white shadow-xl flex flex-col gap-8">
            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-navy border-b border-navy/5 pb-2">1. Security Architecture</h2>
              <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                BillHouse operates a zero-trust architecture model. Our application separates user credentials, client directories, and payment accounts at both database and network routing layers. Security mechanisms are audited regularly to defend against access token leaks and injection patterns.
              </p>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-navy border-b border-navy/5 pb-2">2. Cryptographic Enforcements</h2>
              <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                We safeguard user data using modern, standardized cryptographic protocols:
              </p>
              <ul className="list-disc pl-6 text-text-secondary text-sm md:text-base flex flex-col gap-2">
                <li><strong>Data In Transit:</strong> All platform communications and API integrations are forced over HTTPS using TLS 1.3 enforcements to prevent packet Sniffing.</li>
                <li><strong>Data At Rest:</strong> Databases run on cloud providers utilizing AES-256 volume level encryption.</li>
                <li><strong>Password Safeguards:</strong> In accordance with industry standards, user passwords are salted and hashed using bcryptjs before database entry. Plaint-text passwords are never recorded or logged.</li>
              </ul>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-navy border-b border-navy/5 pb-2">3. Strict Multi-Tenant Separation</h2>
              <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                Multi-tenancy isolation is enforced at the software layer. Every resource query (Clients, Invoices, User Profiles) must explicitly matching the user's validated tenant ID derived from their cryptographic JSON Web Token (JWT). Database indices are optimized to guarantee that query leakage across separate business workspaces is mathematically impossible.
              </p>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-navy border-b border-navy/5 pb-2">4. Access Tokens and Authentication</h2>
              <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                User login states are managed via cryptographically signed JWT keys expiring after 7 days. Email verifications and password recovery links rely on short-lived tokens generated via securely randomized bytes. They are flagged with expiry values (24 hours for signups, 1 hour for password resets) to defend against replay and brute-force testing vectors.
              </p>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-navy border-b border-navy/5 pb-2">5. Infrastructure Backups & Uptime</h2>
              <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                Our MongoDB Atlas databases are configured with automated continuous backup options. We support point-in-time recovery parameter sets. Server instances scale automatically in response to query traffic to avoid denial of service conditions.
              </p>
            </section>

            <section className="flex flex-col gap-4 bg-cream/40 p-6 rounded-2xl border border-navy/5 text-center">
              <h3 className="text-lg font-bold text-navy">Request Audit Reports</h3>
              <p className="text-text-secondary text-sm leading-relaxed mt-1">
                Corporate workspaces requesting detailed SOC 2 Type II summaries or penetration testing reports can contact our security desk.
              </p>
              <p className="text-green-dark font-bold text-sm mt-2">
                Email: security@billhouse.com
              </p>
            </section>
          </GlassCard>
        </div>
      </div>
    </MainLayout>
  );
};

export default SecurityAudit;
