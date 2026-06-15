import React from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, CheckCircle, Clock, Bell, UserPlus, ArrowUpRight, X } from 'lucide-react';
import GlassCard from '../common/GlassCard';

interface DashboardPreviewProps {
  isPlayingVideo: boolean;
  onCloseVideo: () => void;
}

// Mock data for the charts
const revenueData = [
  { month: 'Jan', revenue: 45000 },
  { month: 'Feb', revenue: 52000 },
  { month: 'Mar', revenue: 49000 },
  { month: 'Apr', revenue: 63000 },
  { month: 'May', revenue: 58000 },
  { month: 'Jun', revenue: 75000 },
];

const statusData = [
  { name: 'Paid', value: 65, color: '#2F8F7A' },
  { name: 'Outstanding', value: 25, color: '#E8A317' },
  { name: 'Overdue', value: 10, color: '#E76F51' },
];

const recentInvoices = [
  { id: 'INV-2026-001', client: 'Acme Corporation', amount: '₹48,200', status: 'Paid', date: 'June 08, 2026' },
  { id: 'INV-2026-002', client: 'Design Studio LLC', amount: '₹12,500', status: 'Paid', date: 'June 05, 2026' },
  { id: 'INV-2026-003', client: 'John Doe Consulting', amount: '₹22,000', status: 'Pending', date: 'June 01, 2026' },
  { id: 'INV-2026-004', client: 'Hindustan Retail', amount: '₹8,500', status: 'Overdue', date: 'May 20, 2026' },
];

export const DashboardPreview: React.FC<DashboardPreviewProps> = ({
  isPlayingVideo,
  onCloseVideo,
}) => {
  return (
    <section id="dashboard-preview" className="relative pb-24 px-6 lg:px-8 bg-cream">
      <div className="max-w-7xl mx-auto relative">
        
        {/* Floating cards surrounding the main container */}
        {!isPlayingVideo && (
          <div className="absolute inset-0 pointer-events-none z-20">
            {/* Card 1: Revenue Today */}
            <div className="hidden lg:block absolute -top-8 -left-12 w-60 animate-float-slow pointer-events-auto">
              <GlassCard className="p-4 border-green/20 glass-card">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green/10 rounded-lg text-green">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary font-medium">Revenue Today</p>
                    <p className="text-lg font-bold text-navy">₹15,400</p>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Card 2: Paid Invoice Notification */}
            <div className="hidden lg:block absolute top-1/4 -right-16 w-64 animate-float-medium pointer-events-auto">
              <GlassCard className="p-4 border-green/20 glass-card">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green/15 rounded-lg text-green mt-0.5">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-text-secondary font-medium">Invoice Paid</p>
                    <p className="text-sm font-bold text-navy">Design Studio LLC</p>
                    <p className="text-xs font-semibold text-green">Received ₹12,500</p>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Card 3: New Client Added */}
            <div className="hidden lg:block absolute bottom-1/4 -left-16 w-60 animate-float-medium pointer-events-auto">
              <GlassCard className="p-4 border-navy/10 glass-card">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-navy/5 rounded-lg text-navy">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary font-medium">New Client Added</p>
                    <p className="text-sm font-bold text-navy">Acme Corporation</p>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Card 4: Payment Received Notification */}
            <div className="hidden lg:block absolute -bottom-4 right-8 w-60 animate-float-fast pointer-events-auto">
              <GlassCard className="p-4 border-green/25 glass-card-mint">
                <div className="flex items-center gap-3">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green"></span>
                  </span>
                  <div>
                    <p className="text-xs text-green-dark font-bold">Payment Received</p>
                    <p className="text-sm font-bold text-navy">₹12,500 <span className="text-xs font-normal text-text-secondary">via UPI</span></p>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {/* Dashboard/Video Wrapper Frame */}
        <div className="w-full rounded-[28px] md:rounded-[36px] bg-white border border-navy/10 shadow-2xl p-3 md:p-5 relative z-10 overflow-hidden bg-gradient-soft">
          {/* Header Browser Bar */}
          <div className="flex items-center justify-between px-4 pb-3 border-b border-navy/5 mb-4">
            <div className="flex gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#FF5F56] inline-block"></span>
              <span className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E] inline-block"></span>
              <span className="w-3.5 h-3.5 rounded-full bg-[#27C93F] inline-block"></span>
            </div>
            <div className="px-6 py-1 bg-cream rounded-full border border-navy/5 text-xs text-text-secondary select-none font-medium">
              app.billhouse.com/dashboard
            </div>
            <div className="w-10"></div>
          </div>

          {isPlayingVideo ? (
            /* Video player area */
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-navy flex items-center justify-center">
              <button
                onClick={onCloseVideo}
                className="absolute top-4 right-4 z-30 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm transition-all"
                title="Close Demo"
              >
                <X className="h-5 w-5" />
              </button>
              
              {/* Responsive Demo Video Embed */}
              <iframe
                className="absolute inset-0 w-full h-full border-0"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="BillHouse Walkthrough Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            /* Invoicing SaaS Dashboard Mockup */
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-cream/40 rounded-2xl p-4 md:p-6">
              
              {/* Sidebar navigation stub */}
              <div className="hidden lg:flex flex-col gap-2 col-span-1 pr-4 border-r border-navy/5">
                <div className="flex items-center gap-2 px-3 py-2 bg-green/10 rounded-xl text-green font-semibold">
                  <div className="w-2.5 h-2.5 rounded-full bg-green"></div>
                  Dashboard
                </div>
                <div className="px-3 py-2 text-text-secondary font-medium hover:text-navy hover:bg-navy/5 rounded-xl transition-all">Invoices</div>
                <div className="px-3 py-2 text-text-secondary font-medium hover:text-navy hover:bg-navy/5 rounded-xl transition-all">Clients</div>
                <div className="px-3 py-2 text-text-secondary font-medium hover:text-navy hover:bg-navy/5 rounded-xl transition-all">Payments</div>
                <div className="px-3 py-2 text-text-secondary font-medium hover:text-navy hover:bg-navy/5 rounded-xl transition-all">Reports</div>
                <div className="px-3 py-2 text-text-secondary font-medium hover:text-navy hover:bg-navy/5 rounded-xl transition-all">Settings</div>
              </div>

              {/* Dashboard Content area */}
              <div className="col-span-1 lg:col-span-3 flex flex-col gap-6">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Stat 1 */}
                  <div className="bg-white border border-navy/5 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Total Revenue</p>
                      <p className="text-2xl font-bold text-navy mt-1">₹2,48,900</p>
                    </div>
                    <div className="p-3 bg-green/10 text-green rounded-xl">
                      <DollarSign className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Stat 2 */}
                  <div className="bg-white border border-navy/5 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Outstanding</p>
                      <p className="text-2xl font-bold text-navy mt-1">₹30,500</p>
                    </div>
                    <div className="p-3 bg-warning/10 text-warning rounded-xl">
                      <Clock className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Stat 3 */}
                  <div className="bg-white border border-navy/5 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Paid Invoices</p>
                      <p className="text-2xl font-bold text-navy mt-1">8 Invoices</p>
                    </div>
                    <div className="p-3 bg-green-dark/10 text-green-dark rounded-xl">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Area Chart for Revenue Trend */}
                  <div className="md:col-span-2 bg-white border border-navy/5 p-5 rounded-2xl shadow-sm">
                    <h3 className="text-sm font-bold text-navy mb-4">Revenue Trend (Last 6 Months)</h3>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2F8F7A" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#2F8F7A" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="month" stroke="#5F6B76" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#5F6B76" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                          <Area type="monotone" dataKey="revenue" stroke="#2F8F7A" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Pie Chart for Invoice Status */}
                  <div className="bg-white border border-navy/5 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                    <h3 className="text-sm font-bold text-navy">Invoice Distribution</h3>
                    <div className="h-36 w-full relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={50}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-lg font-bold text-navy">65%</span>
                        <span className="text-[10px] text-text-secondary font-medium">Paid</span>
                      </div>
                    </div>
                    {/* Legend */}
                    <div className="flex justify-between items-center text-[10px] font-semibold text-text-secondary mt-2">
                      {statusData.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }}></span>
                          <span>{item.name} ({item.value}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Recent Invoices list */}
                <div className="bg-white border border-navy/5 p-5 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-navy">Recent Invoices</h3>
                    <span className="text-xs font-bold text-green hover:underline cursor-pointer">View All</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-navy/5 text-text-secondary text-[11px] uppercase tracking-wider font-semibold">
                          <th className="pb-3">Invoice ID</th>
                          <th className="pb-3">Client</th>
                          <th className="pb-3">Date</th>
                          <th className="pb-3">Amount</th>
                          <th className="pb-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy/5 text-navy">
                        {recentInvoices.map((inv, idx) => (
                          <tr key={idx} className="hover:bg-cream/20">
                            <td className="py-3 font-semibold text-xs text-text-secondary">{inv.id}</td>
                            <td className="py-3 font-bold text-navy">{inv.client}</td>
                            <td className="py-3 text-text-secondary text-xs">{inv.date}</td>
                            <td className="py-3 font-bold text-navy">{inv.amount}</td>
                            <td className="py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                                inv.status === 'Paid' 
                                  ? 'bg-green/10 text-green' 
                                  : inv.status === 'Pending' 
                                    ? 'bg-warning/10 text-warning' 
                                    : 'bg-danger/10 text-danger'
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;
