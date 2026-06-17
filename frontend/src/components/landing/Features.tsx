import React from 'react';
import { PlusCircle, Send, CheckCircle2, ShieldAlert, BadgePercent, Sparkles } from 'lucide-react';
import GlassCard from '../common/GlassCard';

interface FeatureCard {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const featuresList: FeatureCard[] = [
  {
    icon: <PlusCircle className="h-6 w-6" />,
    title: "1-Click Invoicing",
    description: "Generate beautiful, professional invoices in seconds using our pre-designed templates tailored for your brand colors.",
  },
  {
    icon: <Send className="h-6 w-6" />,
    title: "Instant Deliverability",
    description: "Send invoices directly to your client's inbox. Track when they open and view the invoice details in real-time.",
  },
  {
    icon: <CheckCircle2 className="h-6 w-6" />,
    title: "Automated Reminders",
    description: "No more awkward payment chases. Our system automatically follows up on outstanding invoices before and after due dates.",
  },
  {
    icon: <BadgePercent className="h-6 w-6" />,
    title: "GST & TDS Ready",
    description: "Built specifically for modern business guidelines. Calculate SGST, CGST, and track TDS deductions effortlessly.",
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: "Detailed Reports",
    description: "Understand your cash flows. Visualize monthly revenue charts, outstanding summaries, and tax estimations in one hub.",
  },
  {
    icon: <ShieldAlert className="h-6 w-6" />,
    title: "Tenant Data Isolation",
    description: "Rest easy knowing your financial details are securely isolated behind strict multi-tenant authentication firewalls.",
  }
];

export const Features: React.FC = () => {
  return (
    <section id="features" className="py-24 bg-cream">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-bold tracking-widest text-green uppercase mb-3">Key Features</h2>
          <p className="text-3xl md:text-5xl font-extrabold tracking-tight text-navy">
            Everything you need to streamline your business billing
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuresList.map((feat, idx) => (
            <GlassCard
              key={idx}
              className="p-6 sm:p-8 border-navy/5 bg-white shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4"
              hoverEffect
            >
              <div className="p-3 bg-green/10 text-green rounded-2xl w-fit">
                {feat.icon}
              </div>
              <h3 className="text-lg font-bold text-navy">{feat.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{feat.description}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
