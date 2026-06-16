import React, { useState, useRef } from 'react';
import API from '../../utils/api';
import { useBusinessProfile, type BusinessProfile } from '../../context/BusinessContext';
import { useAuth } from '../../context/AuthContext';
import {
  Building2, User, Briefcase,
  MapPin, FileText, CheckCircle,
  ChevronRight, ChevronLeft, Upload, X, Sparkles,
  Shield, Banknote
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Basic Info', icon: Building2, desc: 'Tell us about your business' },
  { id: 2, title: 'Address & Tax', icon: MapPin, desc: 'Your location and tax details' },
  { id: 3, title: 'Branding', icon: Sparkles, desc: 'Logo and invoice settings' },
  { id: 4, title: 'Bank Details', icon: Banknote, desc: 'Payment info on invoices' },
];

const BUSINESS_TYPES = [
  { value: 'freelancer', label: 'Freelancer', icon: User, desc: 'Solo professional, 1-person' },
  { value: 'agency', label: 'Agency', icon: Briefcase, desc: 'Small team, 2-20 people' },
  { value: 'business', label: 'Business', icon: Building2, desc: 'Company / organization' },
];

interface FormData {
  // Step 1
  name: string;
  type: 'freelancer' | 'agency' | 'business';
  email: string;
  phone: string;
  // Step 2
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber: string;
  panNumber: string;
  // Step 3
  logoBase64: string;
  invoicePrefix: string;
  invoiceNextNumber: string;
  // Step 4
  bankName: string;
  bankAccount: string;
  bankIfsc: string;
  bankUpi: string;
}

const OnboardingWizard: React.FC = () => {
  const { setOnboardingComplete } = useBusinessProfile();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>({
    name: user?.name ? `${user.name}'s Business` : '',
    type: 'freelancer',
    email: user?.email || '',
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

  const set = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrorMsg(null);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500_000) {
      setErrorMsg('Logo must be under 500KB. Please compress the image and try again.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
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

  const validateStep = (): boolean => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!form.name.trim()) { setErrorMsg('Business name is required.'); return false; }
    }
    if (currentStep === 3) {
      if (!form.invoicePrefix.trim()) { setErrorMsg('Invoice prefix is required.'); return false; }
      const num = parseInt(form.invoiceNextNumber);
      if (isNaN(num) || num < 1) { setErrorMsg('Starting invoice number must be 1 or greater.'); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (currentStep < 4) setCurrentStep(s => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(s => s - 1);
    setErrorMsg(null);
  };



  const handleSave = async () => {
    if (!validateStep()) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const payload = {
        name: form.name.trim() || (user?.name ? `${user.name}'s Business` : 'My Business'),
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
      const response = await API.post('/business', payload);
      setOnboardingComplete(response.data.business as BusinessProfile);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to save business profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = `w-full bg-white border border-navy/10 rounded-xl px-4 py-3 text-sm text-navy 
    placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-green/30 
    focus:border-green/40 transition-all`;
  const labelClass = `block text-xs font-bold text-navy/70 mb-1.5 uppercase tracking-wide`;

  return (
    <div className="fixed inset-0 z-[100] bg-navy/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-cream-50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">

        {/* Header */}
        <div className="bg-navy px-8 pt-8 pb-6 shrink-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green rounded-xl flex items-center justify-center">
              <span className="text-xl">⚡</span>
            </div>
            <div>
              <h1 className="text-white font-black text-lg tracking-tight">Welcome to BillHouse!</h1>
              <p className="text-white/60 text-xs">Let's set up your business profile to get started</p>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isActive = currentStep === step.id;
              return (
                <React.Fragment key={step.id}>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-xs font-bold
                    ${isActive ? 'bg-green text-white' : isCompleted ? 'bg-green/20 text-green' : 'bg-white/10 text-white/40'}`}>
                    {isCompleted
                      ? <CheckCircle className="h-3.5 w-3.5" />
                      : <Icon className="h-3.5 w-3.5" />
                    }
                    <span className="hidden sm:inline">{step.title}</span>
                    <span className="sm:hidden">{step.id}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-px flex-1 transition-all ${isCompleted ? 'bg-green/50' : 'bg-white/10'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="mb-4">
            <h2 className="text-xl font-black text-navy">{STEPS[currentStep - 1].title}</h2>
            <p className="text-sm text-text-secondary">{STEPS[currentStep - 1].desc}</p>
          </div>

          {/* ─── STEP 1: Basic Info ─── */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-4">
              {/* Business Name */}
              <div>
                <label className={labelClass}>Business Name *</label>
                <input
                  id="ob-business-name"
                  type="text"
                  className={inputClass}
                  placeholder="e.g. Rahul's Design Studio"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  autoFocus
                />
              </div>

              {/* Business Type */}
              <div>
                <label className={labelClass}>Business Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {BUSINESS_TYPES.map(({ value, label, icon: Icon, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set('type', value)}
                      className={`flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all
                        ${form.type === value
                          ? 'border-green bg-green/8 shadow-sm'
                          : 'border-navy/10 bg-white hover:border-navy/20'}`}
                    >
                      <Icon className={`h-5 w-5 ${form.type === value ? 'text-green' : 'text-navy/40'}`} />
                      <div>
                        <div className={`text-xs font-extrabold ${form.type === value ? 'text-green' : 'text-navy'}`}>{label}</div>
                        <div className="text-[10px] text-text-secondary leading-tight">{desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Business Email</label>
                  <input
                    id="ob-email"
                    type="email"
                    className={inputClass}
                    placeholder="you@business.com"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input
                    id="ob-phone"
                    type="tel"
                    className={inputClass}
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Address & Tax ─── */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Street Address</label>
                <input
                  id="ob-address"
                  type="text"
                  className={inputClass}
                  placeholder="123, MG Road, Koramangala"
                  value={form.address}
                  onChange={e => set('address', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>City</label>
                  <input id="ob-city" type="text" className={inputClass} placeholder="Bengaluru"
                    value={form.city} onChange={e => set('city', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <input id="ob-state" type="text" className={inputClass} placeholder="Karnataka"
                    value={form.state} onChange={e => set('state', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Pincode</label>
                  <input id="ob-pincode" type="text" className={inputClass} placeholder="560034"
                    value={form.pincode} onChange={e => set('pincode', e.target.value)} />
                </div>
              </div>

              <div className="border-t border-navy/8 pt-4">
                <p className="text-xs font-bold text-navy/50 uppercase tracking-wide mb-3">Tax Identifiers (Optional)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>GST Number</label>
                    <input id="ob-gst" type="text" className={`${inputClass} uppercase`}
                      placeholder="27AABCU9603R1ZX"
                      value={form.gstNumber}
                      onChange={e => set('gstNumber', e.target.value.toUpperCase())} />
                    <p className="text-[10px] text-text-secondary mt-1">15-digit GST registration number</p>
                  </div>
                  <div>
                    <label className={labelClass}>PAN Number</label>
                    <input id="ob-pan" type="text" className={`${inputClass} uppercase`}
                      placeholder="AABCU9603R"
                      value={form.panNumber}
                      onChange={e => set('panNumber', e.target.value.toUpperCase())} />
                    <p className="text-[10px] text-text-secondary mt-1">10-character PAN card number</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 3: Branding & Invoice Config ─── */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-5">
              {/* Logo Upload */}
              <div>
                <label className={labelClass}>Business Logo</label>
                {logoPreview ? (
                  <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-navy/10">
                    <img src={logoPreview} alt="Logo preview" className="h-16 w-16 object-contain rounded-xl border border-navy/8" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-navy">Logo uploaded ✓</p>
                      <p className="text-xs text-text-secondary">Will appear on all invoices</p>
                    </div>
                    <button onClick={removeLogo} className="p-2 hover:bg-red-50 rounded-xl text-red-400 transition-all">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center gap-3 p-8 bg-white border-2 border-dashed border-navy/15 rounded-2xl hover:border-green/40 hover:bg-green/5 transition-all group"
                  >
                    <div className="w-12 h-12 bg-navy/5 group-hover:bg-green/10 rounded-2xl flex items-center justify-center transition-all">
                      <Upload className="h-6 w-6 text-navy/40 group-hover:text-green transition-all" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-navy/70">Click to upload logo</p>
                      <p className="text-xs text-text-secondary">PNG, JPG, SVG, WebP – max 500KB</p>
                    </div>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>

              {/* Invoice Prefix & Starting Number */}
              <div className="border-t border-navy/8 pt-4">
                <p className="text-xs font-bold text-navy/50 uppercase tracking-wide mb-3">Invoice Numbering</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Invoice Prefix *</label>
                    <input id="ob-prefix" type="text" className={`${inputClass} uppercase`}
                      placeholder="INV"
                      value={form.invoicePrefix}
                      onChange={e => set('invoicePrefix', e.target.value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase())}
                      maxLength={8}
                    />
                    <p className="text-[10px] text-text-secondary mt-1">e.g. INV → INV-000001</p>
                  </div>
                  <div>
                    <label className={labelClass}>Starting Number *</label>
                    <input id="ob-next-num" type="number" className={inputClass}
                      placeholder="1"
                      min={1}
                      value={form.invoiceNextNumber}
                      onChange={e => set('invoiceNextNumber', e.target.value)}
                    />
                    <p className="text-[10px] text-text-secondary mt-1">First invoice will be {form.invoicePrefix || 'INV'}-{String(parseInt(form.invoiceNextNumber) || 1).padStart(6, '0')}</p>
                  </div>
                </div>
                {/* Preview */}
                <div className="mt-3 flex items-center gap-3 bg-green/8 border border-green/20 rounded-xl px-4 py-3">
                  <FileText className="h-4 w-4 text-green shrink-0" />
                  <div>
                    <p className="text-xs font-extrabold text-green">Preview</p>
                    <p className="text-sm font-black text-navy">{form.invoicePrefix || 'INV'}-{String(parseInt(form.invoiceNextNumber) || 1).padStart(6, '0')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 4: Bank Details ─── */}
          {currentStep === 4 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <Shield className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">These details appear on your invoices so clients know how to pay you. They are stored securely.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Bank Name</label>
                  <input id="ob-bank-name" type="text" className={inputClass}
                    placeholder="State Bank of India"
                    value={form.bankName}
                    onChange={e => set('bankName', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Account Number</label>
                  <input id="ob-bank-acc" type="text" className={inputClass}
                    placeholder="1234567890"
                    value={form.bankAccount}
                    onChange={e => set('bankAccount', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>IFSC Code</label>
                  <input id="ob-ifsc" type="text" className={`${inputClass} uppercase`}
                    placeholder="SBIN0001234"
                    value={form.bankIfsc}
                    onChange={e => set('bankIfsc', e.target.value.toUpperCase())} />
                </div>
                <div>
                  <label className={labelClass}>UPI ID</label>
                  <input id="ob-upi" type="text" className={inputClass}
                    placeholder="yourname@upi"
                    value={form.bankUpi}
                    onChange={e => set('bankUpi', e.target.value)} />
                </div>
              </div>

              <div className="border-t border-navy/8 pt-4 text-center">
                <p className="text-xs text-text-secondary">✓ All fields in this step are optional. You can add them later in Settings.</p>
              </div>
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-8 py-5 bg-white border-t border-navy/8 flex items-center justify-between gap-4 shrink-0">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all
              ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-navy/60 hover:text-navy hover:bg-navy/5'}`}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex items-center gap-3">
            {/* Next / Finish */}
            {currentStep < 4 ? (
              <button
                id="ob-next-btn"
                onClick={handleNext}
                className="flex items-center gap-2 bg-navy text-white px-6 py-2.5 rounded-xl text-sm font-extrabold hover:bg-navy/90 transition-all shadow-sm"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                id="ob-save-btn"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-green text-white px-6 py-2.5 rounded-xl text-sm font-extrabold hover:bg-green/90 transition-all shadow-sm disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Save & Go to Dashboard
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
