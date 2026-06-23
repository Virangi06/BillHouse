import React, { useState, useRef, useEffect } from 'react';
import API from '../../utils/api';
import { useBusinessProfile, getLogoUrl } from '../../context/BusinessContext';
import {
  Building2, User, Briefcase, MapPin, Upload, X,
  Save, CheckCircle, AlertCircle, Banknote, FileText,
  Shield, BadgePercent, Sparkles, RefreshCw, Globe,
  Clock, Layout, DollarSign, Phone, Bell
} from 'lucide-react';

const BUSINESS_TYPES = [
  { value: 'freelancer', label: 'Freelancer', icon: User },
  { value: 'agency', label: 'Agency', icon: Briefcase },
  { value: 'business', label: 'Business', icon: Building2 },
];

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand',
  'West Bengal','Delhi','Chandigarh','Jammu & Kashmir','Ladakh','Puducherry',
];

const CURRENCIES = [
  { value: 'INR', label: 'INR (₹) Indian Rupee' },
  { value: 'USD', label: 'USD ($) United States Dollar' },
  { value: 'EUR', label: 'EUR (€) Euro' },
  { value: 'GBP', label: 'GBP (£) British Pound' },
];

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: '(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi' },
  { value: 'UTC', label: '(GMT+00:00) Coordinated Universal Time' },
  { value: 'America/New_York', label: '(GMT-05:00) Eastern Time (US & Canada)' },
  { value: 'Europe/London', label: '(GMT+00:00) London, Dublin, Edinburgh' },
];

const INVOICE_FORMATS = [
  { value: '{prefix}-{number}', label: 'INV-000001 (Hyphenated)' },
  { value: '{prefix}/{number}', label: 'INV/000001 (Slashed)' },
  { value: '{prefix}{number}', label: 'INV000001 (Continuous)' },
];

const BusinessSettings: React.FC = () => {
  const { businessProfile, refreshBusinessProfile } = useBusinessProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [bannerPreview, setBannerPreview] = useState<string>('');

  const [form, setForm] = useState({
    name: '',
    legalName: '',
    type: 'freelancer' as 'freelancer' | 'agency' | 'business',
    email: '',
    phone: '',
    website: '',
    address: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: '',
    panNumber: '',
    taxRegistrationNumber: '',
    logoBase64: '',
    bannerBase64: '',
    invoicePrefix: 'INV',
    invoiceNextNumber: '1',
    currency: 'INR',
    timeZone: 'Asia/Kolkata',
    invoiceNumberFormat: '{prefix}-{number}',
    bankName: '',
    bankAccount: '',
    bankIfsc: '',
    bankUpi: '',
    remindersEnabled: true,
    remindersIntervals: [7, 14, 30] as number[],
  });

  // Pre-fill form with existing profile
  useEffect(() => {
    if (businessProfile) {
      setForm({
        name: businessProfile.name || '',
        legalName: businessProfile.legalName || '',
        type: businessProfile.type || 'freelancer',
        email: businessProfile.email || '',
        phone: businessProfile.phone || '',
        website: businessProfile.website || '',
        address: businessProfile.address || '',
        addressLine2: businessProfile.addressLine2 || '',
        city: businessProfile.city || '',
        state: businessProfile.state || '',
        pincode: businessProfile.pincode || '',
        gstNumber: businessProfile.gstNumber || '',
        panNumber: businessProfile.panNumber || '',
        taxRegistrationNumber: businessProfile.taxRegistrationNumber || '',
        logoBase64: businessProfile.logoBase64 || '',
        bannerBase64: businessProfile.bannerBase64 || '',
        invoicePrefix: businessProfile.invoicePrefix || 'INV',
        invoiceNextNumber: String(businessProfile.invoiceNextNumber || 1),
        currency: businessProfile.currency || 'INR',
        timeZone: businessProfile.timeZone || 'Asia/Kolkata',
        invoiceNumberFormat: businessProfile.invoiceNumberFormat || '{prefix}-{number}',
        bankName: businessProfile.bankName || '',
        bankAccount: businessProfile.bankAccount || '',
        bankIfsc: businessProfile.bankIfsc || '',
        bankUpi: businessProfile.bankUpi || '',
        remindersEnabled: businessProfile.remindersEnabled !== undefined ? businessProfile.remindersEnabled : true,
        remindersIntervals: businessProfile.remindersIntervals || [7, 14, 30],
      });
      setLogoPreview(businessProfile.logoBase64 || '');
      setBannerPreview(businessProfile.bannerBase64 || '');
    }
  }, [businessProfile]);

  const set = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) {
      setErrorMsg('Logo must be under 500KB. Please compress it first.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image (PNG, JPG, SVG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const base64 = ev.target?.result as string;
      setLogoPreview(base64);
      set('logoBase64', base64);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoPreview('');
    set('logoBase64', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      setErrorMsg('Banner must be under 1.5MB. Please compress it first.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image (PNG, JPG, SVG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const base64 = ev.target?.result as string;
      setBannerPreview(base64);
      set('bannerBase64', base64);
    };
    reader.readAsDataURL(file);
  };

  const removeBanner = () => {
    setBannerPreview('');
    set('bannerBase64', '');
    if (bannerInputRef.current) bannerInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setErrorMsg('Business name is required.'); return; }
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const payload = {
        name: form.name.trim(),
        legalName: form.legalName.trim(),
        type: form.type,
        email: form.email.trim(),
        phone: form.phone.trim(),
        website: form.website.trim(),
        address: form.address.trim(),
        addressLine2: form.addressLine2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        gstNumber: form.gstNumber.trim().toUpperCase(),
        panNumber: form.panNumber.trim().toUpperCase(),
        taxRegistrationNumber: form.taxRegistrationNumber.trim(),
        logoBase64: form.logoBase64 || '',
        bannerBase64: form.bannerBase64 || '',
        invoicePrefix: form.invoicePrefix.trim().toUpperCase() || 'INV',
        invoiceNextNumber: parseInt(form.invoiceNextNumber) || 1,
        currency: form.currency,
        timeZone: form.timeZone,
        invoiceNumberFormat: form.invoiceNumberFormat,
        bankName: form.bankName.trim(),
        bankAccount: form.bankAccount.trim(),
        bankIfsc: form.bankIfsc.trim().toUpperCase(),
        bankUpi: form.bankUpi.trim(),
        remindersEnabled: form.remindersEnabled,
        remindersIntervals: form.remindersIntervals,
      };

      if (businessProfile) {
        await API.put('/business', payload);
      } else {
        await API.post('/business', payload);
      }
      await refreshBusinessProfile();
      setSuccessMsg('Business settings saved successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = `w-full bg-white border border-navy/10 rounded-xl px-4 py-2.5 text-xs text-navy
    placeholder:text-text-secondary/35 focus:outline-none focus:ring-2 focus:ring-green/20
    focus:border-green/45 transition-all font-semibold`;
    
  const selectClass = `w-full bg-white border border-navy/10 rounded-xl px-4 py-2.5 text-xs text-navy
    focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/45 transition-all font-semibold cursor-pointer`;

  const labelClass = `block text-[10px] font-extrabold text-navy/70 mb-1.5 uppercase tracking-wide select-none`;

  const SectionCard: React.FC<{ icon: React.ElementType; title: string; children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
    <div className="bg-white rounded-2xl border border-navy/5 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-navy/5">
        <div className="w-8 h-8 bg-green/5 rounded-xl flex items-center justify-center">
          <Icon className="h-4.5 w-4.5 text-green" />
        </div>
        <h3 className="text-sm font-extrabold text-navy">{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-navy/5 p-6 rounded-2xl shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-navy tracking-tight">Business Settings</h2>
          <p className="text-xs text-text-secondary font-semibold mt-0.5">
            Manage your company profile, branding assets, tax registry, and default bank payment channels.
          </p>
        </div>
        <button
          id="settings-save-btn"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#0C4737] hover:bg-[#0A3B2F] text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-md disabled:opacity-60"
        >
          {saving
            ? <><RefreshCw className="h-4 w-4 animate-spin" /> Saving...</>
            : <><Save className="h-4 w-4" /> Save Changes</>
          }
        </button>
      </div>

      {/* Success/Error banners */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-green/10 border border-green/35 text-green-dark text-xs font-bold rounded-2xl animate-float-fast">
          <CheckCircle className="h-4 w-4 shrink-0 text-green" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center justify-between gap-3 p-4 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-2xl animate-float-fast">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            {errorMsg}
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        
        {/* Left Column (8 cols): Main details */}
        <div className="lg:col-span-8 flex flex-col gap-6 w-full">
          
          {/* Section 1: Basic Info */}
          <SectionCard icon={Building2} title="Basic Information">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Business Name *</label>
                  <input id="settings-biz-name" type="text" className={inputClass}
                    placeholder="e.g. Rahul's Design Studio"
                    value={form.name}
                    onChange={e => set('name', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Business Owner Name</label>
                  <input id="settings-legal-name" type="text" className={inputClass}
                    placeholder="e.g. Rahul Sharma"
                    value={form.legalName}
                    onChange={e => set('legalName', e.target.value)} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Business Type</label>
                <div className="flex gap-3">
                  {BUSINESS_TYPES.map(({ value, label, icon: Icon }) => (
                    <button key={value} type="button" onClick={() => set('type', value)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-xs font-bold transition-all flex-1 justify-center
                        ${form.type === value ? 'border-green bg-green/8 text-green' : 'border-navy/10 bg-white text-navy/60 hover:border-navy/20'}`}>
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Business Email</label>
                  <input id="settings-email" type="email" className={inputClass}
                    placeholder="you@business.com"
                    value={form.email}
                    onChange={e => set('email', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input id="settings-phone" type="tel" className={inputClass}
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Website</label>
                  <input id="settings-website" type="url" className={inputClass}
                    placeholder="https://yourwebsite.com"
                    value={form.website}
                    onChange={e => set('website', e.target.value)} />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Section 2: Address */}
          <SectionCard icon={MapPin} title="Business Address">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Street Address (Line 1)</label>
                  <input id="settings-address" type="text" className={inputClass}
                    placeholder="123, MG Road"
                    value={form.address}
                    onChange={e => set('address', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Address Line 2</label>
                  <input id="settings-address2" type="text" className={inputClass}
                    placeholder="Koramangala, Suite 502"
                    value={form.addressLine2}
                    onChange={e => set('addressLine2', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>City</label>
                  <input id="settings-city" type="text" className={inputClass} placeholder="Bengaluru"
                    value={form.city} onChange={e => set('city', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <select id="settings-state" className={selectClass}
                    value={form.state} onChange={e => set('state', e.target.value)}>
                    <option value="">Select state</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Pincode</label>
                  <input id="settings-pincode" type="text" className={inputClass} placeholder="560034"
                    value={form.pincode} onChange={e => set('pincode', e.target.value)} />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Section 3: Bank Details */}
          <SectionCard icon={Banknote} title="Bank & Payment Details">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 bg-green/5 border border-green/15 rounded-xl px-4 py-3">
                <Shield className="h-4 w-4 text-green shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#0C4737] font-semibold leading-relaxed">
                  These payment coordinates are automatically rendered inside the remittance card of invoices.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Bank Name</label>
                  <input id="settings-bank-name" type="text" className={inputClass}
                    placeholder="State Bank of India"
                    value={form.bankName}
                    onChange={e => set('bankName', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Account Number</label>
                  <input id="settings-bank-acc" type="text" className={inputClass}
                    placeholder="1234567890"
                    value={form.bankAccount}
                    onChange={e => set('bankAccount', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>IFSC Code</label>
                  <input id="settings-ifsc" type="text" className={`${inputClass} uppercase`}
                    placeholder="SBIN0001234"
                    value={form.bankIfsc}
                    onChange={e => set('bankIfsc', e.target.value.toUpperCase())} />
                </div>
                <div>
                  <label className={labelClass}>UPI ID</label>
                  <input id="settings-upi" type="text" className={inputClass}
                    placeholder="yourname@upi"
                    value={form.bankUpi}
                    onChange={e => set('bankUpi', e.target.value)} />
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Right Column (4 cols): Secondary config */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full lg:sticky lg:top-24">
          
          {/* Section 4: Branding */}
          <SectionCard icon={Sparkles} title="Branding Assets">
            <div className="flex flex-col gap-4">
              {/* Logo */}
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Business Logo</label>
                {logoPreview ? (
                  <div className="flex items-center gap-3 p-3 bg-[#FAFCFB] rounded-2xl border border-navy/10 relative">
                    <img src={getLogoUrl(logoPreview)} alt="Logo" className="h-12 w-12 object-contain rounded-xl border bg-white p-1" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-navy truncate">Logo active</p>
                      <p className="text-[10px] text-text-secondary truncate">Printed on invoices</p>
                    </div>
                    <button onClick={removeLogo} className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center gap-2 py-5 bg-[#FAFCFB] border-2 border-dashed border-navy/15 rounded-2xl hover:border-green/40 hover:bg-green/5 transition-all group">
                    <Upload className="h-5 w-5 text-navy/30 group-hover:text-green transition-all" />
                    <span className="text-[11px] font-bold text-navy/60">Upload Logo (max 500KB)</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </div>

              {/* Banner */}
              <div className="flex flex-col gap-1.5 mt-2">
                <label className={labelClass}>Invoice Brand Banner</label>
                {bannerPreview ? (
                  <div className="flex items-center gap-3 p-3 bg-[#FAFCFB] rounded-2xl border border-navy/10 relative">
                    <img src={getLogoUrl(bannerPreview)} alt="Banner" className="h-10 w-20 object-cover rounded-xl border bg-white" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-navy truncate">Banner active</p>
                      <p className="text-[10px] text-text-secondary truncate">Max 1.5MB size</p>
                    </div>
                    <button onClick={removeBanner} className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => bannerInputRef.current?.click()}
                    className="w-full flex flex-col items-center gap-2 py-5 bg-[#FAFCFB] border-2 border-dashed border-navy/15 rounded-2xl hover:border-green/40 hover:bg-green/5 transition-all group">
                    <Upload className="h-5 w-5 text-navy/30 group-hover:text-green transition-all" />
                    <span className="text-[11px] font-bold text-navy/60">Upload Banner (max 1.5MB)</span>
                  </button>
                )}
                <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
              </div>
            </div>
          </SectionCard>

          {/* Section 5: Invoice Config */}
          <SectionCard icon={FileText} title="Invoice Configuration">
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Currency</label>
                <select className={selectClass} value={form.currency} onChange={e => set('currency', e.target.value)}>
                  {CURRENCIES.map(curr => <option key={curr.value} value={curr.value}>{curr.label}</option>)}
                </select>
              </div>

              <div>
                <label className={labelClass}>Time Zone</label>
                <select className={selectClass} value={form.timeZone} onChange={e => set('timeZone', e.target.value)}>
                  {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Invoice Prefix</label>
                  <input id="settings-prefix" type="text" className={`${inputClass} uppercase`}
                    placeholder="INV"
                    maxLength={8}
                    value={form.invoicePrefix}
                    onChange={e => set('invoicePrefix', e.target.value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase())} />
                </div>
                <div>
                  <label className={labelClass}>Next Number</label>
                  <input id="settings-next-num" type="number" className={inputClass}
                    min={1}
                    value={form.invoiceNextNumber}
                    onChange={e => set('invoiceNextNumber', e.target.value)} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Invoice Number Format</label>
                <select className={selectClass} value={form.invoiceNumberFormat} onChange={e => set('invoiceNumberFormat', e.target.value)}>
                  {INVOICE_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
            </div>
          </SectionCard>

          {/* Section 6: Tax Identifiers */}
          <SectionCard icon={BadgePercent} title="Tax Registry">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>GST Number (India)</label>
                  <input id="settings-gst" type="text" className={`${inputClass} uppercase`}
                    placeholder="27AABCU9603R1ZX"
                    value={form.gstNumber}
                    onChange={e => set('gstNumber', e.target.value.toUpperCase())} />
                </div>
                <div>
                  <label className={labelClass}>PAN Number (India)</label>
                  <input id="settings-pan" type="text" className={`${inputClass} uppercase`}
                    placeholder="AABCU9603R"
                    value={form.panNumber}
                    onChange={e => set('panNumber', e.target.value.toUpperCase())} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Generic Tax Registration Number</label>
                <input id="settings-tax-reg" type="text" className={inputClass}
                  placeholder="e.g. VAT or local tax ID"
                  value={form.taxRegistrationNumber}
                  onChange={e => set('taxRegistrationNumber', e.target.value)} />
              </div>
            </div>
          </SectionCard>

          {/* Section 7: Notification Preferences */}
          <SectionCard icon={Bell} title="Reminder Notifications">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 bg-green/5 border border-green/15 rounded-xl px-4 py-3">
                <Bell className="h-4 w-4 text-green shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#0C4737] font-semibold leading-relaxed">
                  Automate your receivables pipeline by scheduling polite, automatic payment reminders to clients.
                </p>
              </div>
              
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-navy/5 rounded-xl">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-navy">Automated Reminders</span>
                  <span className="text-[10px] text-text-secondary font-semibold">Email clients when invoices become overdue</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={form.remindersEnabled} 
                    onChange={e => set('remindersEnabled', e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green"></div>
                </label>
              </div>

              {form.remindersEnabled && (
                <div className="flex flex-col gap-2 bg-[#FAFCFB] border border-navy/5 p-4 rounded-xl animate-fade-in">
                  <label className={labelClass}>Overdue Reminder Milestones</label>
                  <p className="text-[10px] text-text-secondary font-semibold mb-2">
                    Polite reminder emails will be dispatched to clients at these specific day counts following the invoice due date.
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {[7, 14, 30].map(day => {
                      const isActive = form.remindersIntervals.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            let newIntervals = [...form.remindersIntervals];
                            if (isActive) {
                              newIntervals = newIntervals.filter(d => d !== day);
                            } else {
                              newIntervals = [...newIntervals, day].sort((a, b) => a - b);
                            }
                            set('remindersIntervals', newIntervals);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            isActive
                              ? 'bg-green border-green text-white shadow-sm'
                              : 'bg-white border-navy/10 text-navy/60 hover:bg-navy/5'
                          }`}
                        >
                          {day} Days
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default BusinessSettings;
