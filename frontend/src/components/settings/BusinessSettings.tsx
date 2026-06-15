import React, { useState, useRef, useEffect } from 'react';
import API from '../../utils/api';
import { useBusinessProfile, BusinessProfile } from '../../context/BusinessContext';
import {
  Building2, User, Briefcase, MapPin, Upload, X,
  Save, CheckCircle, AlertCircle, Banknote, FileText,
  Shield, BadgePercent, Sparkles, RefreshCw
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

const BusinessSettings: React.FC = () => {
  const { businessProfile, refreshBusinessProfile } = useBusinessProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  const [form, setForm] = useState({
    name: '',
    type: 'freelancer' as 'freelancer' | 'agency' | 'business',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: '',
    panNumber: '',
    logoBase64: '',
    invoicePrefix: 'INV',
    invoiceNextNumber: '1',
    bankName: '',
    bankAccount: '',
    bankIfsc: '',
    bankUpi: '',
  });

  // Pre-fill form with existing profile
  useEffect(() => {
    if (businessProfile) {
      setForm({
        name: businessProfile.name || '',
        type: businessProfile.type || 'freelancer',
        email: businessProfile.email || '',
        phone: businessProfile.phone || '',
        address: businessProfile.address || '',
        city: businessProfile.city || '',
        state: businessProfile.state || '',
        pincode: businessProfile.pincode || '',
        gstNumber: businessProfile.gstNumber || '',
        panNumber: businessProfile.panNumber || '',
        logoBase64: businessProfile.logoBase64 || '',
        invoicePrefix: businessProfile.invoicePrefix || 'INV',
        invoiceNextNumber: String(businessProfile.invoiceNextNumber || 1),
        bankName: businessProfile.bankName || '',
        bankAccount: businessProfile.bankAccount || '',
        bankIfsc: businessProfile.bankIfsc || '',
        bankUpi: businessProfile.bankUpi || '',
      });
      setLogoPreview(businessProfile.logoBase64 || '');
    }
  }, [businessProfile]);

  const set = (field: string, value: string) => {
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

  const handleSave = async () => {
    if (!form.name.trim()) { setErrorMsg('Business name is required.'); return; }
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        gstNumber: form.gstNumber.trim().toUpperCase(),
        panNumber: form.panNumber.trim().toUpperCase(),
        logoBase64: form.logoBase64 || '',
        invoicePrefix: form.invoicePrefix.trim().toUpperCase() || 'INV',
        invoiceNextNumber: parseInt(form.invoiceNextNumber) || 1,
        bankName: form.bankName.trim(),
        bankAccount: form.bankAccount.trim(),
        bankIfsc: form.bankIfsc.trim().toUpperCase(),
        bankUpi: form.bankUpi.trim(),
      };

      if (businessProfile) {
        await API.put('/business', payload);
      } else {
        await API.post('/business', payload);
      }
      await refreshBusinessProfile();
      setSuccessMsg('Business profile saved successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = `w-full bg-white border border-navy/10 rounded-xl px-4 py-3 text-sm text-navy
    placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-green/30
    focus:border-green/40 transition-all`;
  const labelClass = `block text-xs font-bold text-navy/70 mb-1.5 uppercase tracking-wide`;

  const SectionCard: React.FC<{ icon: React.ElementType; title: string; children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
    <div className="bg-white rounded-2xl border border-navy/8 p-6">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-navy/8">
        <div className="w-8 h-8 bg-navy/5 rounded-xl flex items-center justify-center">
          <Icon className="h-4 w-4 text-navy/60" />
        </div>
        <h3 className="text-sm font-extrabold text-navy">{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-navy">Business Settings</h2>
          <p className="text-sm text-text-secondary mt-0.5">Manage your business profile and invoice defaults</p>
        </div>
        <button
          id="settings-save-btn"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-xl text-sm font-extrabold hover:bg-navy/90 transition-all shadow-sm disabled:opacity-60"
        >
          {saving
            ? <><RefreshCw className="h-4 w-4 animate-spin" /> Saving...</>
            : <><Save className="h-4 w-4" /> Save Changes</>
          }
        </button>
      </div>

      {/* Success/Error banners */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-green/8 border border-green/25 rounded-2xl text-sm font-bold text-green">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center justify-between gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm font-bold text-red-600">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errorMsg}
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* ─── Section 1: Basic Info ─── */}
      <SectionCard icon={Building2} title="Basic Information">
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Business Name *</label>
            <input id="settings-biz-name" type="text" className={inputClass}
              placeholder="e.g. Rahul's Design Studio"
              value={form.name}
              onChange={e => set('name', e.target.value)} />
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
          <div className="grid grid-cols-2 gap-4">
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
          </div>
        </div>
      </SectionCard>

      {/* ─── Section 2: Address ─── */}
      <SectionCard icon={MapPin} title="Business Address">
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Street Address</label>
            <input id="settings-address" type="text" className={inputClass}
              placeholder="123, MG Road, Koramangala"
              value={form.address}
              onChange={e => set('address', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>City</label>
              <input id="settings-city" type="text" className={inputClass} placeholder="Bengaluru"
                value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>State</label>
              <select id="settings-state" className={inputClass}
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

      {/* ─── Section 3: Tax ─── */}
      <SectionCard icon={BadgePercent} title="Tax Identifiers">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>GST Number</label>
            <input id="settings-gst" type="text" className={`${inputClass} uppercase`}
              placeholder="27AABCU9603R1ZX"
              value={form.gstNumber}
              onChange={e => set('gstNumber', e.target.value.toUpperCase())} />
            <p className="text-[10px] text-text-secondary mt-1">Shown on all invoices</p>
          </div>
          <div>
            <label className={labelClass}>PAN Number</label>
            <input id="settings-pan" type="text" className={`${inputClass} uppercase`}
              placeholder="AABCU9603R"
              value={form.panNumber}
              onChange={e => set('panNumber', e.target.value.toUpperCase())} />
            <p className="text-[10px] text-text-secondary mt-1">Required for TDS deductions</p>
          </div>
        </div>
      </SectionCard>

      {/* ─── Section 4: Branding ─── */}
      <SectionCard icon={Sparkles} title="Logo & Branding">
        <div className="flex flex-col gap-4">
          {logoPreview ? (
            <div className="flex items-center gap-4 p-4 bg-cream-50 rounded-2xl border border-navy/10">
              <img src={logoPreview} alt="Logo" className="h-16 w-16 object-contain rounded-xl border border-navy/8 bg-white p-1" />
              <div className="flex-1">
                <p className="text-sm font-bold text-navy">Logo uploaded</p>
                <p className="text-xs text-text-secondary">Shown on all printed invoices</p>
              </div>
              <button onClick={removeLogo} className="flex items-center gap-1.5 text-xs text-red-500 font-bold hover:bg-red-50 px-3 py-2 rounded-xl transition-all">
                <X className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center gap-3 p-8 bg-cream-50 border-2 border-dashed border-navy/15 rounded-2xl hover:border-green/40 hover:bg-green/5 transition-all group">
              <Upload className="h-8 w-8 text-navy/30 group-hover:text-green transition-all" />
              <div className="text-center">
                <p className="text-sm font-bold text-navy/60">Click to upload business logo</p>
                <p className="text-xs text-text-secondary">PNG, JPG, SVG, WebP – max 500KB</p>
              </div>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        </div>
      </SectionCard>

      {/* ─── Section 5: Invoice Config ─── */}
      <SectionCard icon={FileText} title="Invoice Configuration">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Invoice Prefix</label>
              <input id="settings-prefix" type="text" className={`${inputClass} uppercase`}
                placeholder="INV"
                maxLength={8}
                value={form.invoicePrefix}
                onChange={e => set('invoicePrefix', e.target.value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase())} />
              <p className="text-[10px] text-text-secondary mt-1">Used for new invoices only</p>
            </div>
            <div>
              <label className={labelClass}>Next Invoice Number</label>
              <input id="settings-next-num" type="number" className={inputClass}
                min={1}
                value={form.invoiceNextNumber}
                onChange={e => set('invoiceNextNumber', e.target.value)} />
              <p className="text-[10px] text-text-secondary mt-1">Next invoice: {form.invoicePrefix || 'INV'}-{String(parseInt(form.invoiceNextNumber) || 1).padStart(6, '0')}</p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ─── Section 6: Bank Details ─── */}
      <SectionCard icon={Banknote} title="Bank & Payment Details">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <Shield className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">These details appear in the payment section of your invoices so clients know how to pay you.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
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

      {/* Bottom save */}
      <div className="flex justify-end pb-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-navy text-white px-6 py-3 rounded-xl text-sm font-extrabold hover:bg-navy/90 transition-all shadow-sm disabled:opacity-60"
        >
          {saving ? <><RefreshCw className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save All Changes</>}
        </button>
      </div>
    </div>
  );
};

export default BusinessSettings;
