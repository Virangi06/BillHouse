import React, { useState, useRef, useEffect } from 'react';
import API from '../../utils/api';
import { useBusinessProfile, getLogoUrl } from '../../context/BusinessContext';
import {
  Building2, User, Briefcase, MapPin, Upload, X,
  Save, CheckCircle, AlertCircle, Banknote, FileText,
  Shield, BadgePercent, Sparkles, RefreshCw, Globe,
  Clock, DollarSign, Phone, Bell, Mail, Hash,
  CreditCard, Landmark, QrCode, Settings2,
  CheckCircle2
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
  { value: 'INR', label: 'INR (₹) — Indian Rupee' },
  { value: 'USD', label: 'USD ($) — US Dollar' },
  { value: 'EUR', label: 'EUR (€) — Euro' },
  { value: 'GBP', label: 'GBP (£) — British Pound' },
];

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: '(GMT+05:30) Mumbai, Delhi, Kolkata' },
  { value: 'UTC', label: '(GMT+00:00) Coordinated Universal Time' },
  { value: 'America/New_York', label: '(GMT-05:00) Eastern Time (US)' },
  { value: 'Europe/London', label: '(GMT+00:00) London, Dublin' },
];

const INVOICE_FORMATS = [
  { value: '{prefix}-{number}', label: 'INV-000001 (Hyphenated)' },
  { value: '{prefix}/{number}', label: 'INV/000001 (Slashed)' },
  { value: '{prefix}{number}', label: 'INV000001 (Continuous)' },
];

type TabKey = 'profile' | 'address' | 'branding' | 'invoice' | 'tax' | 'bank' | 'notifications';

const TABS: { key: TabKey; label: string; icon: React.ElementType; description: string }[] = [
  { key: 'profile',       label: 'Business Profile',   icon: Building2,     description: 'Name, type & contact' },
  { key: 'address',       label: 'Address',            icon: MapPin,        description: 'Location & region' },
  { key: 'branding',      label: 'Branding',           icon: Sparkles,      description: 'Logo & banner assets' },
  { key: 'invoice',       label: 'Invoice Config',     icon: FileText,      description: 'Numbering & currency' },
  { key: 'tax',           label: 'Tax Registry',       icon: BadgePercent,  description: 'GST, PAN & tax IDs' },
  { key: 'bank',          label: 'Bank & Payment',     icon: Banknote,      description: 'Account & UPI details' },
  { key: 'notifications', label: 'Reminders',          icon: Bell,          description: 'Auto-reminder settings' },
];

const BusinessSettings: React.FC = () => {
  const { businessProfile, refreshBusinessProfile } = useBusinessProfile();
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [bannerPreview, setBannerPreview] = useState<string>('');

  const [form, setForm] = useState({
    name: '', legalName: '', type: 'freelancer' as 'freelancer' | 'agency' | 'business',
    email: '', phone: '', website: '',
    address: '', addressLine2: '', city: '', state: '', pincode: '',
    gstNumber: '', panNumber: '', taxRegistrationNumber: '',
    logoBase64: '', bannerBase64: '',
    invoicePrefix: 'INV', invoiceNextNumber: '1',
    currency: 'INR', timeZone: 'Asia/Kolkata',
    invoiceNumberFormat: '{prefix}-{number}',
    bankName: '', bankAccount: '', bankIfsc: '', bankUpi: '',
    remindersEnabled: true,
    remindersIntervals: [7, 14, 30] as number[],
  });

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
    if (file.size > 500_000) { setErrorMsg('Logo must be under 500KB.'); return; }
    if (!file.type.startsWith('image/')) { setErrorMsg('Please upload a valid image.'); return; }
    const reader = new FileReader();
    reader.onload = ev => { const b64 = ev.target?.result as string; setLogoPreview(b64); set('logoBase64', b64); };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => { setLogoPreview(''); set('logoBase64', ''); if (fileInputRef.current) fileInputRef.current.value = ''; };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) { setErrorMsg('Banner must be under 1.5MB.'); return; }
    if (!file.type.startsWith('image/')) { setErrorMsg('Please upload a valid image.'); return; }
    const reader = new FileReader();
    reader.onload = ev => { const b64 = ev.target?.result as string; setBannerPreview(b64); set('bannerBase64', b64); };
    reader.readAsDataURL(file);
  };

  const removeBanner = () => { setBannerPreview(''); set('bannerBase64', ''); if (bannerInputRef.current) bannerInputRef.current.value = ''; };

  const handleSave = async () => {
    if (!form.name.trim()) { setErrorMsg('Business name is required.'); return; }
    setSaving(true); setErrorMsg(null); setSuccessMsg(null);
    try {
      const payload = {
        name: form.name.trim(), legalName: form.legalName.trim(), type: form.type,
        email: form.email.trim(), phone: form.phone.trim(), website: form.website.trim(),
        address: form.address.trim(), addressLine2: form.addressLine2.trim(),
        city: form.city.trim(), state: form.state.trim(), pincode: form.pincode.trim(),
        gstNumber: form.gstNumber.trim().toUpperCase(), panNumber: form.panNumber.trim().toUpperCase(),
        taxRegistrationNumber: form.taxRegistrationNumber.trim(),
        logoBase64: form.logoBase64 || '', bannerBase64: form.bannerBase64 || '',
        invoicePrefix: form.invoicePrefix.trim().toUpperCase() || 'INV',
        invoiceNextNumber: parseInt(form.invoiceNextNumber) || 1,
        currency: form.currency, timeZone: form.timeZone,
        invoiceNumberFormat: form.invoiceNumberFormat,
        bankName: form.bankName.trim(), bankAccount: form.bankAccount.trim(),
        bankIfsc: form.bankIfsc.trim().toUpperCase(), bankUpi: form.bankUpi.trim(),
        remindersEnabled: form.remindersEnabled, remindersIntervals: form.remindersIntervals,
      };
      if (businessProfile) { await API.put('/business', payload); }
      else { await API.post('/business', payload); }
      await refreshBusinessProfile();
      setSuccessMsg('Business settings saved successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to save settings. Please try again.');
    } finally { setSaving(false); }
  };

  /* ── Design tokens ─────────────────────────────────── */
  const inputClass = `w-full bg-white border border-navy/10 rounded-xl px-4 py-2.5 text-xs text-navy
    placeholder:text-navy/25 focus:outline-none focus:ring-2 focus:ring-green/20
    focus:border-green/50 transition-all font-semibold`;
  const inputIconClass = `w-full bg-white border border-navy/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-navy
    placeholder:text-navy/25 focus:outline-none focus:ring-2 focus:ring-green/20
    focus:border-green/50 transition-all font-semibold`;
  const selectClass = `w-full bg-white border border-navy/10 rounded-xl px-4 py-2.5 text-xs text-navy
    focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/50 transition-all font-semibold cursor-pointer`;
  const labelClass = `block text-[10px] font-extrabold text-navy/60 mb-1.5 uppercase tracking-widest select-none`;

  /* ── Reusable Field wrapper with icon ──────────────── */
  const Field: React.FC<{ label: string; icon?: React.ElementType; children: React.ReactNode; span?: 1|2 }> =
    ({ label, icon: Icon, children }) => (
      <div className="flex flex-col gap-0">
        <label className={labelClass}>{label}</label>
        <div className="relative">
          {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-navy/30 pointer-events-none" />}
          {children}
        </div>
      </div>
    );

  /* ── Stat chip shown in the header ─────────────────── */
  const statChips = [
    { label: 'Business',   value: form.name || '—', icon: Building2 },
    { label: 'Currency',   value: form.currency,     icon: DollarSign },
    { label: 'GST',        value: form.gstNumber || 'Not set', icon: BadgePercent },
    { label: 'Reminders',  value: form.remindersEnabled ? `${form.remindersIntervals.length} active` : 'Disabled', icon: Bell },
  ];

  /* ── Tab content renderer ───────────────────────────── */
  const renderTab = () => {
    switch (activeTab) {

      /* ── Profile ── */
      case 'profile': return (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Business Name *" icon={Building2}>
              <input id="settings-biz-name" type="text" className={inputIconClass}
                placeholder="e.g. Rahul's Design Studio"
                value={form.name} onChange={e => set('name', e.target.value)} />
            </Field>
            <Field label="Owner / Legal Name" icon={User}>
              <input id="settings-legal-name" type="text" className={inputIconClass}
                placeholder="e.g. Rahul Sharma"
                value={form.legalName} onChange={e => set('legalName', e.target.value)} />
            </Field>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Business Type</label>
            <div className="grid grid-cols-3 gap-3">
              {BUSINESS_TYPES.map(({ value, label, icon: Icon }) => (
                <button key={value} type="button" onClick={() => set('type', value)}
                  className={`flex flex-col items-center gap-2 px-3 py-4 rounded-2xl border-2 text-xs font-bold transition-all
                    ${form.type === value
                      ? 'border-green bg-green/8 text-green shadow-sm shadow-green/10'
                      : 'border-navy/8 bg-white text-navy/50 hover:border-navy/20 hover:text-navy/70'}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all
                    ${form.type === value ? 'bg-green/15' : 'bg-navy/5'}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Business Email" icon={Mail}>
              <input id="settings-email" type="email" className={inputIconClass}
                placeholder="you@business.com"
                value={form.email} onChange={e => set('email', e.target.value)} />
            </Field>
            <Field label="Phone Number" icon={Phone}>
              <input id="settings-phone" type="tel" className={inputIconClass}
                placeholder="+91 98765 43210"
                value={form.phone} onChange={e => set('phone', e.target.value)} />
            </Field>
            <Field label="Website" icon={Globe}>
              <input id="settings-website" type="url" className={inputIconClass}
                placeholder="https://yourwebsite.com"
                value={form.website} onChange={e => set('website', e.target.value)} />
            </Field>
          </div>
        </div>
      );

      /* ── Address ── */
      case 'address': return (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Street Address (Line 1)" icon={MapPin}>
              <input id="settings-address" type="text" className={inputIconClass}
                placeholder="123, MG Road"
                value={form.address} onChange={e => set('address', e.target.value)} />
            </Field>
            <Field label="Address Line 2">
              <input id="settings-address2" type="text" className={inputClass}
                placeholder="Koramangala, Suite 502"
                value={form.addressLine2} onChange={e => set('addressLine2', e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="City">
              <input id="settings-city" type="text" className={inputClass}
                placeholder="Bengaluru"
                value={form.city} onChange={e => set('city', e.target.value)} />
            </Field>
            <Field label="State">
              <select id="settings-state" className={selectClass}
                value={form.state} onChange={e => set('state', e.target.value)}>
                <option value="">Select state</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Pincode" icon={Hash}>
              <input id="settings-pincode" type="text" className={inputIconClass}
                placeholder="560034"
                value={form.pincode} onChange={e => set('pincode', e.target.value)} />
            </Field>
          </div>

          {/* Map-style address preview */}
          {(form.address || form.city) && (
            <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-green/5 to-mint/20 border border-green/15 rounded-2xl">
              <div className="w-9 h-9 bg-green/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="h-4 w-4 text-green" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-green-dark uppercase tracking-widest mb-1">Address Preview</p>
                <p className="text-xs font-semibold text-navy leading-relaxed">
                  {[form.address, form.addressLine2, form.city, form.state, form.pincode].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>
      );

      /* ── Branding ── */
      case 'branding': return (
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <label className={labelClass}>Business Logo</label>
                <p className="text-[11px] text-navy/50 font-semibold -mt-1">Appears on all invoices. PNG/SVG recommended. Max 500KB.</p>
              </div>
            </div>
            {logoPreview ? (
              <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-[#FAFCFB] to-white rounded-2xl border border-navy/8 shadow-sm">
                <div className="p-2 bg-white rounded-xl border border-navy/8 shadow-sm">
                  <img src={getLogoUrl(logoPreview)} alt="Logo" className="h-14 w-14 object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-extrabold text-navy">Logo uploaded</p>
                  <p className="text-[10px] text-green font-bold flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="h-3 w-3" /> Active on invoices
                  </p>
                </div>
                <button onClick={removeLogo}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center gap-3 py-8 bg-[#FAFCFB] border-2 border-dashed border-navy/12 rounded-2xl hover:border-green/40 hover:bg-green/5 transition-all group cursor-pointer">
                <div className="w-12 h-12 bg-navy/5 group-hover:bg-green/10 rounded-2xl flex items-center justify-center transition-all">
                  <Upload className="h-5 w-5 text-navy/30 group-hover:text-green transition-all" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-extrabold text-navy/50 group-hover:text-navy/70 transition-all">Click to upload logo</p>
                  <p className="text-[10px] text-navy/35 font-semibold mt-0.5">PNG, JPG, SVG, WebP — Max 500KB</p>
                </div>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>

          {/* Divider */}
          <div className="border-t border-navy/5" />

          {/* Banner */}
          <div className="flex flex-col gap-2">
            <div>
              <label className={labelClass}>Invoice Brand Banner</label>
              <p className="text-[11px] text-navy/50 font-semibold -mt-1">Wide banner displayed at the top of invoice PDFs. Max 1.5MB.</p>
            </div>
            {bannerPreview ? (
              <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-[#FAFCFB] to-white rounded-2xl border border-navy/8 shadow-sm">
                <img src={getLogoUrl(bannerPreview)} alt="Banner" className="h-12 w-24 object-cover rounded-xl border border-navy/10" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-extrabold text-navy">Banner uploaded</p>
                  <p className="text-[10px] text-green font-bold flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="h-3 w-3" /> Active on invoices
                  </p>
                </div>
                <button onClick={removeBanner}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => bannerInputRef.current?.click()}
                className="w-full flex flex-col items-center gap-3 py-8 bg-[#FAFCFB] border-2 border-dashed border-navy/12 rounded-2xl hover:border-green/40 hover:bg-green/5 transition-all group cursor-pointer">
                <div className="w-12 h-12 bg-navy/5 group-hover:bg-green/10 rounded-2xl flex items-center justify-center transition-all">
                  <Upload className="h-5 w-5 text-navy/30 group-hover:text-green transition-all" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-extrabold text-navy/50 group-hover:text-navy/70 transition-all">Click to upload banner</p>
                  <p className="text-[10px] text-navy/35 font-semibold mt-0.5">PNG, JPG, WebP — Max 1.5MB</p>
                </div>
              </button>
            )}
            <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
          </div>
        </div>
      );

      /* ── Invoice Config ── */
      case 'invoice': return (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Currency" icon={DollarSign}>
              <select className={selectClass} value={form.currency} onChange={e => set('currency', e.target.value)}>
                {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Time Zone" icon={Clock}>
              <select className={selectClass} value={form.timeZone} onChange={e => set('timeZone', e.target.value)}>
                {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Invoice Prefix" icon={Hash}>
              <input id="settings-prefix" type="text" className={`${inputIconClass} uppercase`}
                placeholder="INV" maxLength={8}
                value={form.invoicePrefix}
                onChange={e => set('invoicePrefix', e.target.value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase())} />
            </Field>
            <Field label="Next Invoice Number">
              <input id="settings-next-num" type="number" className={inputClass}
                min={1} value={form.invoiceNextNumber}
                onChange={e => set('invoiceNextNumber', e.target.value)} />
            </Field>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Invoice Number Format</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {INVOICE_FORMATS.map(f => (
                <button key={f.value} type="button" onClick={() => set('invoiceNumberFormat', f.value)}
                  className={`px-3 py-3 rounded-xl border-2 text-xs font-bold transition-all text-left
                    ${form.invoiceNumberFormat === f.value
                      ? 'border-green bg-green/8 text-green shadow-sm'
                      : 'border-navy/8 bg-white text-navy/50 hover:border-navy/20'}`}>
                  <span className="font-extrabold text-[11px] block mb-0.5">{f.label.split(' ')[0]}</span>
                  <span className="text-[10px] opacity-70">{f.label.split(' ').slice(1).join(' ')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-navy/3 to-navy/5 border border-navy/8 rounded-2xl">
            <div className="w-9 h-9 bg-navy/8 rounded-xl flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-navy/50" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-navy/50 uppercase tracking-widest mb-0.5">Preview</p>
              <p className="text-sm font-extrabold text-navy">
                {form.invoiceNumberFormat
                  .replace('{prefix}', form.invoicePrefix || 'INV')
                  .replace('{number}', String(form.invoiceNextNumber || 1).padStart(6, '0'))}
              </p>
            </div>
          </div>
        </div>
      );

      /* ── Tax Registry ── */
      case 'tax': return (
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/60 rounded-2xl">
            <Shield className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-extrabold text-amber-800 mb-0.5">Compliance Information</p>
              <p className="text-[11px] text-amber-700 font-semibold leading-relaxed">
                Your tax identifiers are printed on each invoice as mandated by Indian tax law. Ensure these are accurate.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="GST Number (India)" icon={BadgePercent}>
              <input id="settings-gst" type="text" className={`${inputIconClass} uppercase`}
                placeholder="27AABCU9603R1ZX"
                value={form.gstNumber}
                onChange={e => set('gstNumber', e.target.value.toUpperCase())} />
            </Field>
            <Field label="PAN Number (India)" icon={CreditCard}>
              <input id="settings-pan" type="text" className={`${inputIconClass} uppercase`}
                placeholder="AABCU9603R"
                value={form.panNumber}
                onChange={e => set('panNumber', e.target.value.toUpperCase())} />
            </Field>
          </div>

          <Field label="Generic Tax Registration / VAT Number">
            <input id="settings-tax-reg" type="text" className={inputClass}
              placeholder="e.g. VAT-123456 or any local tax ID"
              value={form.taxRegistrationNumber}
              onChange={e => set('taxRegistrationNumber', e.target.value)} />
          </Field>
        </div>
      );

      /* ── Bank & Payment ── */
      case 'bank': return (
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-green/5 to-mint/20 border border-green/15 rounded-2xl">
            <Shield className="h-4 w-4 text-green shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-extrabold text-green-dark mb-0.5">Secure & Auto-Printed</p>
              <p className="text-[11px] text-[#0C4737] font-semibold leading-relaxed">
                These payment details are automatically included in the remittance section of every invoice.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Bank Name" icon={Landmark}>
              <input id="settings-bank-name" type="text" className={inputIconClass}
                placeholder="State Bank of India"
                value={form.bankName} onChange={e => set('bankName', e.target.value)} />
            </Field>
            <Field label="Account Number" icon={Hash}>
              <input id="settings-bank-acc" type="text" className={inputIconClass}
                placeholder="1234567890"
                value={form.bankAccount} onChange={e => set('bankAccount', e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="IFSC Code" icon={Settings2}>
              <input id="settings-ifsc" type="text" className={`${inputIconClass} uppercase`}
                placeholder="SBIN0001234"
                value={form.bankIfsc}
                onChange={e => set('bankIfsc', e.target.value.toUpperCase())} />
            </Field>
            <Field label="UPI ID" icon={QrCode}>
              <input id="settings-upi" type="text" className={inputIconClass}
                placeholder="yourname@upi"
                value={form.bankUpi} onChange={e => set('bankUpi', e.target.value)} />
            </Field>
          </div>

          {/* Bank info card preview */}
          {(form.bankName || form.bankAccount) && (
            <div className="p-4 bg-gradient-to-br from-navy/3 to-navy/5 border border-navy/8 rounded-2xl">
              <p className="text-[10px] font-extrabold text-navy/50 uppercase tracking-widest mb-3">Bank Card Preview</p>
              <div className="grid grid-cols-2 gap-3">
                {form.bankName && (
                  <div><p className="text-[10px] text-navy/40 font-bold uppercase tracking-wider">Bank</p>
                    <p className="text-xs font-extrabold text-navy">{form.bankName}</p></div>
                )}
                {form.bankAccount && (
                  <div><p className="text-[10px] text-navy/40 font-bold uppercase tracking-wider">Account</p>
                    <p className="text-xs font-extrabold text-navy">{form.bankAccount}</p></div>
                )}
                {form.bankIfsc && (
                  <div><p className="text-[10px] text-navy/40 font-bold uppercase tracking-wider">IFSC</p>
                    <p className="text-xs font-extrabold text-navy">{form.bankIfsc}</p></div>
                )}
                {form.bankUpi && (
                  <div><p className="text-[10px] text-navy/40 font-bold uppercase tracking-wider">UPI</p>
                    <p className="text-xs font-extrabold text-navy">{form.bankUpi}</p></div>
                )}
              </div>
            </div>
          )}
        </div>
      );

      /* ── Notifications ── */
      case 'notifications': return (
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/60 rounded-2xl">
            <Bell className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-extrabold text-blue-800 mb-0.5">Automated Receivables</p>
              <p className="text-[11px] text-blue-700 font-semibold leading-relaxed">
                Schedule polite, automatic payment reminders to clients when invoices pass their due date.
              </p>
            </div>
          </div>

          {/* Master toggle */}
          <div className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${form.remindersEnabled ? 'bg-green/5 border-green/20' : 'bg-slate-50 border-navy/8'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${form.remindersEnabled ? 'bg-green/15' : 'bg-navy/8'}`}>
                <Bell className={`h-4.5 w-4.5 transition-all ${form.remindersEnabled ? 'text-green' : 'text-navy/40'}`} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-navy">Automated Reminders</p>
                <p className="text-[11px] text-navy/50 font-semibold">
                  {form.remindersEnabled ? 'Enabled — emails sent on schedule' : 'Disabled — no emails will be sent'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input type="checkbox" checked={form.remindersEnabled}
                onChange={e => set('remindersEnabled', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer
                peer-checked:after:translate-x-full peer-checked:after:border-white
                after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                after:bg-white after:border-slate-300 after:border after:rounded-full
                after:h-5 after:w-5 after:transition-all peer-checked:bg-green" />
            </label>
          </div>

          {/* Interval toggles */}
          {form.remindersEnabled && (
            <div className="flex flex-col gap-4 p-5 bg-[#FAFCFB] border border-navy/5 rounded-2xl">
              <div>
                <label className={labelClass}>Reminder Milestones (days after due date)</label>
                <p className="text-[11px] text-navy/50 font-semibold">
                  Clients receive reminder emails on these days. Toggle each milestone on or off.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[7, 14, 30].map(day => {
                  const isActive = form.remindersIntervals.includes(day);
                  return (
                    <button key={day} type="button"
                      onClick={() => {
                        let next = [...form.remindersIntervals];
                        if (isActive) next = next.filter(d => d !== day);
                        else next = [...next, day].sort((a, b) => a - b);
                        set('remindersIntervals', next);
                      }}
                      className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 font-bold transition-all
                        ${isActive
                          ? 'border-green bg-green/8 text-green shadow-sm shadow-green/10'
                          : 'border-navy/8 bg-white text-navy/40 hover:border-navy/20'}`}>
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
              {form.remindersIntervals.length === 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <p className="text-[11px] text-amber-700 font-semibold">Select at least one reminder milestone.</p>
                </div>
              )}
            </div>
          )}
        </div>
      );

      default: return null;
    }
  };

  const currentTab = TABS.find(t => t.key === activeTab)!;

  return (
    <div className="flex flex-col gap-6 w-full max-w-full">

      {/* ── Header (white, invoice-page style) ────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-navy/5 p-6 rounded-2xl shadow-sm gap-4">
        <div className="flex items-center gap-4">
          {/* Logo or avatar */}
          <div className="w-12 h-12 rounded-2xl bg-green/8 border border-green/15 flex items-center justify-center shrink-0 overflow-hidden">
            {logoPreview
              ? <img src={getLogoUrl(logoPreview)} alt="Logo" className="w-full h-full object-contain p-1" />
              : <Building2 className="h-5.5 w-5.5 text-green" />
            }
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-navy tracking-tight">
              {form.name || 'Business Settings'}
            </h2>
            <p className="text-xs text-text-secondary font-semibold mt-0.5">
              Manage your profile, branding, taxes & notifications
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Quick stat chips */}
          <div className="hidden md:flex items-center gap-2">
            {statChips.slice(0, 2).map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-navy/4 border border-navy/8 rounded-full">
                <Icon className="h-3 w-3 text-green" />
                <span className="text-[10px] font-bold text-navy/50">{label}:</span>
                <span className="text-[10px] font-extrabold text-navy">{value}</span>
              </div>
            ))}
          </div>
          <button id="settings-save-btn" onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-[#0C4737] hover:bg-[#0A3B2F] text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-md disabled:opacity-60 w-full sm:w-auto justify-center">
            {saving
              ? <><RefreshCw className="h-4 w-4 animate-spin" /> Saving...</>
              : <><Save className="h-4 w-4" /> Save Changes</>
            }
          </button>
        </div>
      </div>

      {/* ── Alerts ─────────────────────────────────────── */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-green/10 border border-green/25 text-green-dark text-xs font-bold rounded-2xl">
          <CheckCircle className="h-4 w-4 shrink-0 text-green" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center justify-between gap-3 p-4 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-2xl">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            {errorMsg}
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* ── Main Content: Horizontal tabs + Panel ──────── */}
      <div className="flex flex-col gap-4">

        {/* Horizontal tab bar */}
        <div className="bg-white border border-navy/5 rounded-2xl shadow-sm p-1.5 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap
                    ${isActive
                      ? 'bg-navy text-white shadow-sm'
                      : 'text-navy/55 hover:bg-navy/5 hover:text-navy'}`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all
                    ${isActive ? 'bg-white/15' : 'bg-navy/5'}`}>
                    <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-navy/50'}`} />
                  </div>
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab panel */}
        <div className="bg-white border border-navy/5 rounded-2xl shadow-sm overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-navy/5 bg-gradient-to-r from-[#FAFCFB] to-white">
            <div className="w-8 h-8 bg-green/8 rounded-xl flex items-center justify-center shrink-0">
              <currentTab.icon className="h-4 w-4 text-green" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-navy">{currentTab.label}</h3>
              <p className="text-[11px] text-navy/50 font-semibold">{currentTab.description}</p>
            </div>
          </div>

          {/* Panel body */}
          <div className="p-6">
            {renderTab()}
          </div>

          {/* Panel footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-navy/5 bg-[#FAFCFB]">
            <p className="text-[11px] text-navy/40 font-semibold">
              Changes apply to all invoices going forward.
            </p>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-[#0C4737] hover:bg-[#0A3B2F] text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-md disabled:opacity-60">
              {saving
                ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Saving...</>
                : <><Save className="h-3.5 w-3.5" /> Save Changes</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessSettings;
