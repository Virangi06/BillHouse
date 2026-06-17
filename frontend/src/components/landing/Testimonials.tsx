import React from 'react';
import { Star } from 'lucide-react';
import GlassCard from '../common/GlassCard';

interface TestimonialItem {
  quote: string;
  author: string;
  role: string;
  rating: number;
}

const testimonials: TestimonialItem[] = [
  {
    quote: "BillHouse has cut down my monthly invoicing time from 5 hours to less than 15 minutes. The automatic payment reminders do all the chasing for me!",
    author: "Aravind Sharma",
    role: "Freelance Full-Stack Developer",
    rating: 5,
  },
  {
    quote: "With multiple clients and different retainer contracts, payment tracking used to be chaotic. BillHouse organizes everything beautifully and GST calculations are instant.",
    author: "Priya Nair",
    role: "Creative Agency Director",
    rating: 5,
  },
  {
    quote: "As an accountant, I love the audit logs and clear tax summaries BillHouse exports. It makes filing client GST and income tax completely stress-free.",
    author: "Rajesh Gupta, CA",
    role: "Gupta Financial Services",
    rating: 5,
  },
];

export const Testimonials: React.FC = () => {
  return (
    <section id="testimonials" className="py-24 bg-cream-light border-y border-navy/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-bold tracking-widest text-green uppercase mb-3">Testimonials</h2>
          <p className="text-3xl md:text-5xl font-extrabold tracking-tight text-navy">
            Loved by independent professionals & small teams
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <GlassCard 
              key={idx} 
              className="p-6 sm:p-8 flex flex-col justify-between border-navy/5 bg-white shadow-sm hover:shadow-md transition-all duration-300"
              hoverEffect
            >
              <div>
                {/* Rating stars */}
                <div className="flex gap-1 mb-6 text-[#FFC107]">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                {/* Quote */}
                <p className="text-navy text-base leading-relaxed italic mb-8 font-medium">
                  "{t.quote}"
                </p>
              </div>

              {/* Author Profile */}
              <div>
                <hr className="border-navy/5 mb-4" />
                <h4 className="font-bold text-navy text-sm">{t.author}</h4>
                <p className="text-text-secondary text-xs font-semibold">{t.role}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
