import React, { useState, useEffect } from 'react';
import { useBusinessProfile, getLogoUrl } from '../../context/BusinessContext';
import { usePopup } from '../../context/PopupContext';
import API from '../../utils/api';
import {
  Bell,
  Clock,
  Save,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  FileText,
  Info
} from 'lucide-react';

const ReminderSettings: React.FC = () => {
  const { businessProfile, refreshBusinessProfile } = useBusinessProfile();
  
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(true);
  const [remindersIntervals, setRemindersIntervals] = useState<number[]>([7, 14, 30]);
  const [reminderTemplate, setReminderTemplate] = useState<'professional' | 'friendly' | 'urgent'>('professional');
  const [saving, setSaving] = useState<boolean>(false);
  const { showPopup } = usePopup();

  useEffect(() => {
    if (businessProfile) {
      setRemindersEnabled(businessProfile.remindersEnabled !== false);
      setRemindersIntervals(businessProfile.remindersIntervals || [7, 14, 30]);
      setReminderTemplate(businessProfile.reminderTemplate || 'professional');
    }
  }, [businessProfile]);

  const toggleInterval = (day: number) => {
    setRemindersIntervals(prev => {
      let next = [...prev];
      if (next.includes(day)) {
        next = next.filter(d => d !== day);
      } else {
        next = [...next, day].sort((a, b) => a - b);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await API.put('/business', {
        remindersEnabled,
        remindersIntervals,
        reminderTemplate,
      });
      await refreshBusinessProfile();
      showPopup({
        title: 'Success',
        message: 'Reminder automation settings updated successfully!',
        type: 'success'
      });
    } catch (err: any) {
      showPopup({
        title: 'Error',
        message: err.response?.data?.error || 'Failed to update reminder settings.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Format currency helpers matching reports
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: businessProfile?.currency || 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto animate-fade-in text-left">
      
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-navy/5 p-6 rounded-2xl shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-navy tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-green" />
            Automated Reminders
          </h2>
          <p className="text-xs text-text-secondary font-semibold mt-0.5">
            Configure automated schedule alerts and keep tracking of your receivables.
          </p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#0C4737] hover:bg-[#0A3B2F] text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-md disabled:opacity-60 w-full sm:w-auto justify-center active:scale-98 cursor-pointer"
        >
          {saving ? (
            <><RefreshCw className="h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="h-4 w-4" /> Save Automation</>
          )}
        </button>
      </div>

      {/* Alerts are handled by global usePopup */}

      {/* Main Grid split: settings / live preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Settings Panel (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white border border-navy/5 rounded-3xl shadow-sm p-6 flex flex-col gap-6">
            
            {/* Info Block */}
            <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-150 rounded-2xl">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-extrabold text-blue-800 mb-0.5">How it works</p>
                <p className="text-[11px] text-blue-700 font-semibold leading-relaxed">
                  BillHouse scans active unpaid invoices nightly. If an invoice crosses your chosen overdue milestone days, a reminder email is automatically dispatched.
                </p>
              </div>
            </div>

            {/* Master Toggle */}
            <div className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${remindersEnabled ? 'bg-green/5 border-green/20' : 'bg-slate-50 border-navy/8'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${remindersEnabled ? 'bg-green/15' : 'bg-navy/8'}`}>
                  <Bell className={`h-4.5 w-4.5 transition-all ${remindersEnabled ? 'text-green' : 'text-navy/40'}`} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-extrabold text-navy">Auto-Reminders State</p>
                  <p className="text-[11px] text-navy/55 font-semibold">
                    {remindersEnabled ? 'Sending scheduled emails' : 'Reminders are paused'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remindersEnabled}
                  onChange={e => setRemindersEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer
                  peer-checked:after:translate-x-full peer-checked:after:border-white
                  after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                  after:bg-white after:border-slate-300 after:border after:rounded-full
                  after:h-5 after:w-5 after:transition-all peer-checked:bg-green"
                />
              </label>
            </div>

            {/* Intervals Selector */}
            {remindersEnabled && (
              <div className="flex flex-col gap-4 p-4 bg-[#FAFCFB] border border-navy/5 rounded-2xl">
                <div className="text-left">
                  <label className="block text-[10px] font-extrabold text-navy/60 mb-1 uppercase tracking-widest">Milestones (Days Overdue)</label>
                  <p className="text-[11px] text-navy/50 font-semibold">
                    Activate the milestones below to trigger automated reminders.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[7, 14, 30].map(day => {
                    const isActive = remindersIntervals.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleInterval(day)}
                        className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 font-bold transition-all cursor-pointer
                          ${isActive
                            ? 'border-green bg-green/8 text-green shadow-sm shadow-green/10'
                            : 'border-navy/8 bg-white text-navy/40 hover:border-navy/20'}`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-green/15' : 'bg-navy/5'}`}>
                          <Clock className={`h-4 w-4 ${isActive ? 'text-green' : 'text-navy/30'}`} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-extrabold">{day}</p>
                          <p className="text-[10px] font-bold opacity-70">Days</p>
                        </div>
                        {isActive && <span className="text-[9px] font-extrabold text-green uppercase tracking-widest">Active</span>}
                      </button>
                    );
                  })}
                </div>
                {remindersIntervals.length === 0 && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <p className="text-[11px] text-amber-700 font-semibold">Select at least one reminder milestone to trigger automation.</p>
                  </div>
                )}
              </div>
            )}

            {/* Template Selector */}
            {remindersEnabled && (
              <div className="flex flex-col gap-4 p-4 bg-[#FAFCFB] border border-navy/5 rounded-2xl">
                <div className="text-left">
                  <label className="block text-[10px] font-extrabold text-navy/60 mb-1 uppercase tracking-widest">Email Format Template</label>
                  <p className="text-[11px] text-navy/50 font-semibold">
                    Choose the tone of your automated reminder emails.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { value: 'professional', label: 'Professional', desc: 'Formal and polite standard template.' },
                    { value: 'friendly', label: 'Friendly Check-in', desc: 'Conversational, warm, and encouraging tone.' },
                    { value: 'urgent', label: 'Urgent Demand', desc: 'Direct, strict notice for serious overdue invoices.' }
                  ].map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => { setReminderTemplate(t.value as any); }}
                      className={`w-full p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col gap-0.5
                        ${reminderTemplate === t.value
                          ? 'border-green bg-green/8 text-navy shadow-sm'
                          : 'border-navy/8 bg-white text-navy/50 hover:border-navy/20'}`}
                    >
                      <span className={`text-xs font-black ${reminderTemplate === t.value ? 'text-green-dark' : 'text-navy'}`}>{t.label}</span>
                      <span className="text-[10px] font-medium opacity-80 leading-snug">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick save button under settings */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-navy hover:bg-[#1a2d3c] text-white py-3 rounded-xl text-xs font-black transition-all shadow-md disabled:opacity-60 active:scale-98 cursor-pointer"
            >
              {saving ? (
                <><RefreshCw className="h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="h-4 w-4" /> Save Configurations</>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: High-fidelity interactive email preview (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-[#06121E]/5 p-4 rounded-3xl border border-navy/5 flex flex-col gap-3">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green"></div>
                <span className="text-xs font-extrabold text-navy uppercase tracking-wider">Client Email Mockup</span>
              </div>
              <span className="text-[10px] text-navy/40 font-semibold">Real-time template rendering</span>
            </div>

            {/* Mail client container */}
            <div className="bg-white rounded-2xl border border-navy/10 shadow-lg overflow-hidden flex flex-col">
              
              {/* Mail client Header */}
              <div className="bg-[#F8FAFC] border-b border-navy/8 p-4 text-xs font-semibold text-navy/70 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span><strong className="text-navy">From:</strong> reminders@billhouse.io (via BillHouse Scheduler)</span>
                  <span className="text-[10px] text-navy/40 font-medium">Just now</span>
                </div>
                <div className="border-t border-navy/5 my-1" />
                <div>
                  <strong className="text-navy">To:</strong> client-billing@example.com
                </div>
                <div className="border-t border-navy/5 my-1" />
                <div>
                  <strong className="text-navy">Subject:</strong> {reminderTemplate === 'friendly' ? `Friendly Check-in: Invoice INV-000104 from ${businessProfile?.name || 'Your Business Name'}` : reminderTemplate === 'urgent' ? `URGENT NOTICE: Invoice INV-000104 is severely past due` : `Overdue Reminder: Invoice INV-000104 is overdue`}
                </div>
              </div>

              {/* Mail Body */}
              <div className={`p-6 md:p-8 text-sm text-navy/80 font-normal leading-relaxed text-left flex flex-col gap-6 max-h-[500px] overflow-y-auto ${reminderTemplate === 'urgent' ? 'bg-red-50/20' : 'bg-white'}`}>
                
                {/* Header branding inside mail */}
                <div className={`flex items-center justify-between border-b pb-4 ${reminderTemplate === 'friendly' ? 'border-green/10' : reminderTemplate === 'urgent' ? 'border-red-200' : 'border-navy/5'}`}>
                  <div className="flex items-center gap-3">
                    {businessProfile?.logoBase64 ? (
                      <img 
                        src={getLogoUrl(businessProfile.logoBase64)} 
                        alt="Logo" 
                        className="h-10 w-10 object-contain"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${reminderTemplate === 'friendly' ? 'bg-green/10' : reminderTemplate === 'urgent' ? 'bg-red-100' : 'bg-green/10'}`}>
                        <FileText className={`h-5 w-5 ${reminderTemplate === 'urgent' ? 'text-red-600' : 'text-green'}`} />
                      </div>
                    )}
                    <span className={`font-extrabold text-base ${reminderTemplate === 'urgent' ? 'text-red-900' : 'text-navy'}`}>{businessProfile?.name || 'Your Business Name'}</span>
                  </div>

                  <span className={`px-2.5 py-0.5 text-[9px] border rounded-full font-black uppercase tracking-wider
                    ${reminderTemplate === 'friendly' ? 'bg-green/10 text-green border-green/20' : reminderTemplate === 'urgent' ? 'bg-red-100 text-red-600 border-red-200' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                    {reminderTemplate === 'friendly' ? 'Friendly Check-in' : reminderTemplate === 'urgent' ? 'Critically Overdue' : '7 Days Overdue'}
                  </span>
                </div>

                {reminderTemplate === 'friendly' ? (
                  <div>
                    <p className="font-bold text-navy text-base">Hi Accounts Team,</p>
                    <p className="mt-3">
                      Hope you are having a wonderful week! Just sending a quick, friendly check-in regarding invoice <strong className="font-mono text-navy font-extrabold">INV-000104</strong> for services with <strong>{businessProfile?.name || 'Your Business Name'}</strong>. It was due on <strong>{(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong>.
                    </p>
                    <p className="mt-3">
                      If you've already sent payment, please disregard this note. Otherwise, we would appreciate it if you could arrange settlement at your earliest convenience.
                    </p>
                  </div>
                ) : reminderTemplate === 'urgent' ? (
                  <div>
                    <p className="font-bold text-red-900 text-base">Dear Accounts Team / Client,</p>
                    <p className="mt-3">
                      This is a formal notice that invoice <strong className="font-mono text-navy font-extrabold">INV-000104</strong> issued by <strong>{businessProfile?.name || 'Your Business Name'}</strong> remains unpaid and is now severely past due. The original due date was <strong>{(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong>.
                    </p>
                    <p className="mt-3">
                      Please process payment immediately to settle this outstanding amount. Kindly reply directly to this email with payment verification details or a wire confirmation number once completed.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-navy text-base">Dear Accounts Team,</p>
                    <p className="mt-3">
                      We hope you are doing well. This is a gentle, automated reminder that invoice <strong className="font-mono text-navy font-extrabold">INV-000104</strong> is now outstanding.
                    </p>
                    <p className="mt-2">
                      According to our records, the payment was due on <strong className="text-navy">{(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong>, and is currently <span className="px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full font-bold text-xs inline-block">7 Days Overdue</span>.
                    </p>
                  </div>
                )}

                {/* Summary Table */}
                <div className="bg-[#F8FAFC] border border-navy/8 rounded-2xl p-4 flex flex-col gap-2">
                  <div className="grid grid-cols-2 text-xs font-semibold text-navy/50 uppercase tracking-wider">
                    <span>Invoice #</span>
                    <span className="text-right">Outstanding Amount</span>
                  </div>
                  <div className="grid grid-cols-2 font-extrabold text-navy">
                    <span className="font-mono text-sm">INV-000104</span>
                    <span className="text-right text-lg text-red-500">{formatINR(25000)}</span>
                  </div>
                  <div className="border-t border-navy/5 my-1" />
                  <div className="flex justify-between text-xs text-navy/50 font-medium">
                    <span>Due Date</span>
                    <span>{(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Remittance Bank Card if configured */}
                {(businessProfile?.bankName || businessProfile?.bankAccount) && (
                  <div className="border border-navy/10 rounded-2xl p-4">
                    <p className="text-[10px] font-extrabold text-navy/40 uppercase tracking-widest mb-3">Bank Remittance Instructions</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {businessProfile.bankName && (
                        <div>
                          <p className="font-bold text-navy/50">Bank Name</p>
                          <p className="font-bold text-navy">{businessProfile.bankName}</p>
                        </div>
                      )}
                      {businessProfile.bankAccount && (
                        <div>
                          <p className="font-bold text-navy/50">Account Number</p>
                          <p className="font-bold text-navy">{businessProfile.bankAccount}</p>
                        </div>
                      )}
                      {businessProfile.bankIfsc && (
                        <div>
                          <p className="font-bold text-navy/50">IFSC Code</p>
                          <p className="font-bold text-navy">{businessProfile.bankIfsc}</p>
                        </div>
                      )}
                      {businessProfile.bankUpi && (
                        <div>
                          <p className="font-bold text-navy/50">UPI ID</p>
                          <p className="font-bold text-navy">{businessProfile.bankUpi}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col items-center py-2">
                  <a
                    href="#pay"
                    onClick={e => e.preventDefault()}
                    className={`px-6 py-3 text-white font-extrabold text-xs rounded-xl shadow-md cursor-default text-center inline-block transition-all
                      ${reminderTemplate === 'friendly' ? 'bg-[#10b981] hover:bg-[#059669]' : reminderTemplate === 'urgent' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0C4737] hover:bg-[#0A3B2F]'}`}
                  >
                    💳 Settle Invoice Amount
                  </a>
                </div>

                <div className="text-xs text-navy/50 border-t border-navy/5 pt-4 mt-2">
                  <p>Thank you for your business!</p>
                  <p className="font-bold mt-1 text-navy">{businessProfile?.name || 'Your Business Name'}</p>
                  <p className="mt-4 leading-normal italic text-[11px]">
                    Note: This is an automated notification from BillHouse. If you have already processed the payment, please ignore this email or email us at {businessProfile?.email || 'your-support@email.com'}.
                  </p>
                </div>

              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ReminderSettings;
