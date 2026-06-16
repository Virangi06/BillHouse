import React, { useState, useRef, useEffect } from 'react';
import API from '../../utils/api';
import { useBusinessProfile } from '../../context/BusinessContext';
import {
  Building2, User, MapPin, Upload, X, Save, Globe,
  Shield, FileText, Sparkles, CheckCircle, AlertCircle, Compass,
  DollarSign, Clock, Layout, RefreshCw, BarChart2, Briefcase, Phone,
  Edit3
} from 'lucide-react';

const PROFILE_FIELDS = [
  { key: 'legalName', label: 'Business Owner Name', category: 'Basic Info' },
  { key: 'name', label: 'Business Name', category: 'Basic Info' },
  { key: 'email', label: 'Business Email', category: 'Basic Info' },
  { key: 'phone', label: 'Business Phone', category: 'Basic Info' },
  { key: 'website', label: 'Website', category: 'Basic Info' },
  { key: 'industry', label: 'Industry', category: 'Basic Info' },
  { key: 'address', label: 'Address Line 1', category: 'Address' },
  { key: 'addressLine2', label: 'Address Line 2', category: 'Address' },
  { key: 'city', label: 'City', category: 'Address' },
  { key: 'state', label: 'State', category: 'Address' },
  { key: 'country', label: 'Country', category: 'Address' },
  { key: 'pincode', label: 'Postal Code', category: 'Address' },
  { key: 'gstNumber', label: 'GST Number', category: 'Tax' },
  { key: 'panNumber', label: 'PAN Number', category: 'Tax' },
  { key: 'taxRegistrationNumber', label: 'Tax Registration Number', category: 'Tax' },
  { key: 'logoBase64', label: 'Company Logo', category: 'Branding' },
  { key: 'bannerBase64', label: 'Company Banner', category: 'Branding' },
  { key: 'currency', label: 'Currency', category: 'Settings' },
  { key: 'timeZone', label: 'Time Zone', category: 'Settings' },
  { key: 'invoicePrefix', label: 'Invoice Prefix', category: 'Settings' },
  { key: 'invoiceNumberFormat', label: 'Invoice Number Format', category: 'Settings' },
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

const INDUSTRIES = [
  'Software & IT Services',
  'Creative & Design',
  'Marketing & Advertising',
  'Consulting & Business Services',
  'E-commerce & Retail',
  'Education & Training',
  'Finance & Legal Services',
  'Healthcare & Wellness',
  'Other Services'
];

const BusinessProfilePage: React.FC = () => {
  const { businessProfile, refreshBusinessProfile } = useBusinessProfile();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    legalName: '',
    type: 'freelancer' as 'freelancer' | 'agency' | 'business',
    email: '',
    phone: '',
    website: '',
    industry: '',
    address: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    gstNumber: '',
    panNumber: '',
    taxRegistrationNumber: '',
    logoBase64: '',
    bannerBase64: '',
    currency: 'INR',
    timeZone: 'Asia/Kolkata',
    invoicePrefix: 'INV',
    invoiceNumberFormat: '{prefix}-{number}',
  });

  // Calculate completion details
  const getProfileCompletion = () => {
    const totalFields = PROFILE_FIELDS.length;
    const currentProfile = businessProfile || form;
    const filledFields = PROFILE_FIELDS.filter(field => {
      const val = (currentProfile as any)[field.key];
      return val !== undefined && val !== null && String(val).trim() !== '';
    });
    
    const percentage = Math.round((filledFields.length / totalFields) * 100);
    const missingFields = PROFILE_FIELDS.filter(field => {
      const val = (currentProfile as any)[field.key];
      return val === undefined || val === null || String(val).trim() === '';
    });

    return { percentage, missingFields };
  };

  const { percentage: completionPct, missingFields } = getProfileCompletion();

  // Populate form from context
  const resetForm = () => {
    if (businessProfile) {
      setForm({
        name: businessProfile.name || '',
        legalName: businessProfile.legalName || '',
        type: businessProfile.type || 'freelancer',
        email: businessProfile.email || '',
        phone: businessProfile.phone || '',
        website: businessProfile.website || '',
        industry: businessProfile.industry || '',
        address: businessProfile.address || '',
        addressLine2: businessProfile.addressLine2 || '',
        city: businessProfile.city || '',
        state: businessProfile.state || '',
        pincode: businessProfile.pincode || '',
        country: businessProfile.country || 'India',
        gstNumber: businessProfile.gstNumber || '',
        panNumber: businessProfile.panNumber || '',
        taxRegistrationNumber: businessProfile.taxRegistrationNumber || '',
        logoBase64: businessProfile.logoBase64 || '',
        bannerBase64: businessProfile.bannerBase64 || '',
        currency: businessProfile.currency || 'INR',
        timeZone: businessProfile.timeZone || 'Asia/Kolkata',
        invoicePrefix: businessProfile.invoicePrefix || 'INV',
        invoiceNumberFormat: businessProfile.invoiceNumberFormat || '{prefix}-{number}',
      });
    }
  };

  useEffect(() => {
    resetForm();
  }, [businessProfile]);

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Image Upload Handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoBase64' | 'bannerBase64') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const limit = field === 'logoBase64' ? 500_000 : 1_500_000;
    const limitLabel = field === 'logoBase64' ? '500KB' : '1.5MB';

    if (file.size > limit) {
      setErrorMsg(`Image must be under ${limitLabel}. Please compress first.`);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      const base64 = ev.target?.result as string;
      handleInputChange(field, base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setErrorMsg('Business Name is a required field.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (businessProfile) {
        await API.put('/business', form);
      } else {
        await API.post('/business', form);
      }

      await refreshBusinessProfile();
      setSuccessMsg('Business profile saved successfully!');
      setIsEditMode(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to save business profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    setIsEditMode(false);
    setErrorMsg(null);
  };

  // UI styling helpers
  const viewRow = (label: string, value?: string, icon?: React.ReactNode) => (
    <div className="py-3.5 border-b border-navy/5 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-semibold">
      <span className="text-text-secondary flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className="text-navy font-extrabold mt-1 sm:mt-0">
        {value && value.trim() ? value : <span className="italic text-text-secondary/30 font-medium">Not specified</span>}
      </span>
    </div>
  );

  const inputClass = `w-full bg-[#F8FAFC] border border-navy/10 rounded-xl px-4 py-3 text-xs text-navy
    placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-green/30
    focus:border-green/40 transition-all font-semibold`;
  
  const selectClass = `w-full bg-[#F8FAFC] border border-navy/10 rounded-xl px-4 py-3 text-xs text-navy
    focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green/40 transition-all font-semibold`;

  const labelClass = `block text-[10px] font-extrabold text-navy/70 mb-1.5 uppercase tracking-wide`;

  // Empty State Layout
  if (!businessProfile && !isEditMode) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white border border-navy/5 shadow-md rounded-3xl p-8 text-center flex flex-col items-center gap-6">
        <div className="w-16 h-16 bg-[#0C4737]/10 rounded-full flex items-center justify-center text-[#0C4737]">
          <Building2 className="h-8 w-8" />
        </div>
        <div>
          <h3 className="text-lg font-black text-navy">Set Up Your Business Profile</h3>
          <p className="text-xs text-text-secondary mt-2 font-semibold">
            Complete your business profile to start creating professional invoices.
          </p>
        </div>
        <button
          onClick={() => {
            setIsEditMode(true);
            setForm({
              name: '',
              legalName: '',
              type: 'freelancer',
              email: '',
              phone: '',
              website: '',
              industry: '',
              address: '',
              addressLine2: '',
              city: '',
              state: '',
              pincode: '',
              country: 'India',
              gstNumber: '',
              panNumber: '',
              taxRegistrationNumber: '',
              logoBase64: '',
              bannerBase64: '',
              currency: 'INR',
              timeZone: 'Asia/Kolkata',
              invoicePrefix: 'INV',
              invoiceNumberFormat: '{prefix}-{number}',
            });
          }}
          className="flex items-center gap-2 bg-[#0C4737] hover:bg-[#0A3B2F] text-white px-6 py-3 rounded-xl text-xs font-extrabold transition-all shadow-md active:scale-98"
        >
          Create Profile
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto animate-fade-in pb-12">
      
      {/* Premium Header Banner Block */}
      <div className="bg-gradient-to-r from-navy to-[#0C4737] text-white rounded-3xl p-8 relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-green/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Business Profile</h2>
            <p className="text-xs text-white/70 font-semibold mt-1">
              Manage your business information, branding, and invoice settings.
            </p>
          </div>
          
          {!isEditMode ? (
            <button
              onClick={() => setIsEditMode(true)}
              className="flex items-center gap-2 bg-green hover:bg-[#257362] text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-sm active:scale-98"
            >
              <Edit3 className="h-4 w-4" />
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2.5 rounded-xl text-xs font-extrabold text-white border border-white/20 hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-green hover:bg-[#257362] text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-sm disabled:opacity-60 active:scale-98"
              >
                {saving ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="h-4 w-4" /> Save Changes</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Success/Error Alerts */}
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

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: Completion status & Brand assets previews */}
        <div className="flex flex-col gap-8 lg:col-span-1">
          
          {/* Profile Completion Indicator Card */}
          <div className="bg-white border border-navy/5 p-6 rounded-2xl shadow-sm flex flex-col gap-5">
            <div className="flex items-center gap-2 pb-3 border-b border-navy/5">
              <BarChart2 className="h-4 w-4 text-green" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-navy">Business Profile Completion</h3>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-xs font-bold text-navy">
                <span>Current Status</span>
                <span>{completionPct}% Complete</span>
              </div>
              <div className="w-full h-2.5 bg-navy/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green transition-all duration-500 rounded-full" 
                  style={{ width: `${completionPct}%` }}
                ></div>
              </div>
            </div>

            {/* Missing actions list */}
            {missingFields.length > 0 && (
              <div className="mt-2 flex flex-col gap-2 bg-[#F8FAFC] p-4 rounded-xl border border-navy/5">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary mb-1">Incomplete Fields Indicator:</p>
                <div className="max-h-48 overflow-y-auto flex flex-col gap-2 pr-1">
                  {missingFields.map(field => (
                    <button
                      key={field.key}
                      onClick={() => setIsEditMode(true)}
                      className="text-left text-[11px] font-bold text-green hover:underline flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 bg-green rounded-full"></span>
                      Add {field.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Branding Assets Preview card */}
          <div className="bg-white border border-navy/5 p-6 rounded-2xl shadow-sm flex flex-col gap-5">
            <div className="flex items-center gap-2 pb-3 border-b border-navy/5">
              <Sparkles className="h-4 w-4 text-green" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-navy">Active Branding Preview</h3>
            </div>
            
            {/* Banner preview */}
            <div className="relative w-full h-32 bg-navy/5 border border-navy/8 rounded-xl overflow-hidden flex items-center justify-center">
              {form.bannerBase64 ? (
                <img src={form.bannerBase64} alt="Company banner" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-text-secondary/40 uppercase tracking-widest">No Banner Uploaded</span>
              )}
              
              {/* Logo preview overlapping */}
              <div className="absolute bottom-2 left-4 w-12 h-12 bg-white border border-navy/8 rounded-xl p-1 flex items-center justify-center shadow-md">
                {form.logoBase64 ? (
                  <img src={form.logoBase64} alt="Company logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <Building2 className="h-5 w-5 text-text-secondary/35" />
                )}
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Redesigned Cards */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* CARD 1: Basic Information */}
          <div className="bg-white border border-navy/5 p-6 md:p-8 rounded-2xl shadow-sm">
            <h3 className="text-sm font-extrabold text-navy pb-3 border-b border-navy/5 mb-5 flex items-center gap-2">
              <User className="h-4.5 w-4.5 text-green" /> Basic Information
            </h3>
            
            {!isEditMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                {viewRow('Business Owner Name', form.legalName, <User className="h-3.5 w-3.5 text-green" />)}
                {viewRow('Business Name', form.name, <Building2 className="h-3.5 w-3.5 text-green" />)}
                {viewRow('Business Email', form.email, <Briefcase className="h-3.5 w-3.5 text-green" />)}
                {viewRow('Business Phone', form.phone, <Phone className="h-3.5 w-3.5 text-green" />)}
                {viewRow('Website', form.website, <Globe className="h-3.5 w-3.5 text-green" />)}
                {viewRow('Industry', form.industry, <Compass className="h-3.5 w-3.5 text-green" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Business Owner Name</label>
                  <input type="text" className={inputClass} placeholder="e.g. Alex Johnson"
                    value={form.legalName} onChange={e => handleInputChange('legalName', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Business Name *</label>
                  <input type="text" className={inputClass} placeholder="e.g. Acme Corp"
                    value={form.name} onChange={e => handleInputChange('name', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Business Email</label>
                  <input type="email" className={inputClass} placeholder="billing@acme.com"
                    value={form.email} onChange={e => handleInputChange('email', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Business Phone</label>
                  <input type="tel" className={inputClass} placeholder="+91 98765 43210"
                    value={form.phone} onChange={e => handleInputChange('phone', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Website</label>
                  <input type="url" className={inputClass} placeholder="https://acme.com"
                    value={form.website} onChange={e => handleInputChange('website', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Industry</label>
                  <select className={selectClass} value={form.industry} onChange={e => handleInputChange('industry', e.target.value)}>
                    <option value="">Select Industry</option>
                    {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* CARD 2: Business Address */}
          <div className="bg-white border border-navy/5 p-6 md:p-8 rounded-2xl shadow-sm">
            <h3 className="text-sm font-extrabold text-navy pb-3 border-b border-navy/5 mb-5 flex items-center gap-2">
              <MapPin className="h-4.5 w-4.5 text-green" /> Business Address
            </h3>
            
            {!isEditMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                {viewRow('Address Line 1', form.address, <MapPin className="h-3.5 w-3.5 text-green" />)}
                {viewRow('Address Line 2', form.addressLine2, <MapPin className="h-3.5 w-3.5 text-green" />)}
                {viewRow('City', form.city, <MapPin className="h-3.5 w-3.5 text-green" />)}
                {viewRow('State', form.state, <MapPin className="h-3.5 w-3.5 text-green" />)}
                {viewRow('Country', form.country, <MapPin className="h-3.5 w-3.5 text-green" />)}
                {viewRow('Postal Code', form.pincode, <MapPin className="h-3.5 w-3.5 text-green" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Address Line 1</label>
                  <input type="text" className={inputClass} placeholder="Street Address, PO Box"
                    value={form.address} onChange={e => handleInputChange('address', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Address Line 2</label>
                  <input type="text" className={inputClass} placeholder="Suite, Unit, Building, Floor"
                    value={form.addressLine2} onChange={e => handleInputChange('addressLine2', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input type="text" className={inputClass} placeholder="e.g. Bengaluru"
                    value={form.city} onChange={e => handleInputChange('city', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <input type="text" className={inputClass} placeholder="e.g. Karnataka"
                    value={form.state} onChange={e => handleInputChange('state', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Country</label>
                  <input type="text" className={inputClass} placeholder="e.g. India"
                    value={form.country} onChange={e => handleInputChange('country', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Postal Code</label>
                  <input type="text" className={inputClass} placeholder="e.g. 560001"
                    value={form.pincode} onChange={e => handleInputChange('pincode', e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* CARD 3: Tax Information */}
          <div className="bg-white border border-navy/5 p-6 md:p-8 rounded-2xl shadow-sm">
            <h3 className="text-sm font-extrabold text-navy pb-3 border-b border-navy/5 mb-5 flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-green" /> Tax Information
            </h3>
            
            {!isEditMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                {viewRow('GST Number', form.gstNumber, <Shield className="h-3.5 w-3.5 text-green" />)}
                {viewRow('PAN Number', form.panNumber, <Shield className="h-3.5 w-3.5 text-green" />)}
                {viewRow('Tax Registration Number', form.taxRegistrationNumber, <Shield className="h-3.5 w-3.5 text-green" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>GST Number</label>
                  <input type="text" className={`${inputClass} uppercase`} placeholder="27AAAAA1111A1Z1"
                    value={form.gstNumber} onChange={e => handleInputChange('gstNumber', e.target.value.toUpperCase())} />
                </div>
                <div>
                  <label className={labelClass}>PAN Number</label>
                  <input type="text" className={`${inputClass} uppercase`} placeholder="ABCDE1234F"
                    value={form.panNumber} onChange={e => handleInputChange('panNumber', e.target.value.toUpperCase())} />
                </div>
                <div>
                  <label className={labelClass}>Tax Registration Number</label>
                  <input type="text" className={inputClass} placeholder="Tax Identifier"
                    value={form.taxRegistrationNumber} onChange={e => handleInputChange('taxRegistrationNumber', e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* CARD 4: Branding */}
          <div className="bg-white border border-navy/5 p-6 md:p-8 rounded-2xl shadow-sm">
            <h3 className="text-sm font-extrabold text-navy pb-3 border-b border-navy/5 mb-5 flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-green" /> Branding
            </h3>
            
            {!isEditMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-semibold text-text-secondary">
                <div className="flex flex-col gap-2">
                  <span>Logo</span>
                  {form.logoBase64 ? (
                    <img src={form.logoBase64} alt="Logo" className="w-16 h-16 object-contain rounded-xl border p-1 bg-white" />
                  ) : (
                    <span className="italic text-text-secondary/30 font-medium">No logo uploaded</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <span>Banner</span>
                  {form.bannerBase64 ? (
                    <img src={form.bannerBase64} alt="Banner" className="w-32 h-16 object-cover rounded-xl border bg-white" />
                  ) : (
                    <span className="italic text-text-secondary/30 font-medium">No banner uploaded</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Logo Upload (Optional) */}
                <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-navy/5 flex flex-col gap-3">
                  <label className={labelClass}>Logo Upload (Optional)</label>
                  {form.logoBase64 ? (
                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-navy/5">
                      <img src={form.logoBase64} alt="Logo preview" className="w-12 h-12 object-contain rounded-lg border" />
                      <div className="flex-1">
                        <span className="text-[11px] font-bold text-navy block">Logo Active</span>
                        <span className="text-[9px] text-text-secondary block">Under 500KB</span>
                      </div>
                      <button type="button" onClick={() => handleInputChange('logoBase64', '')} className="text-red-400 hover:text-red-600 p-1">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => logoInputRef.current?.click()} className="w-full py-6 bg-white border border-dashed border-navy/15 rounded-xl hover:border-green/40 hover:bg-green/5 transition-all text-center flex flex-col items-center justify-center gap-2">
                      <Upload className="h-5 w-5 text-text-secondary" />
                      <span className="text-xs font-bold text-navy/60">Upload Logo</span>
                    </button>
                  )}
                  <input type="file" ref={logoInputRef} accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'logoBase64')} />
                </div>

                {/* Banner Upload (Optional) */}
                <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-navy/5 flex flex-col gap-3">
                  <label className={labelClass}>Banner Upload (Optional)</label>
                  {form.bannerBase64 ? (
                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-navy/5">
                      <img src={form.bannerBase64} alt="Banner preview" className="w-20 h-10 object-cover rounded-lg border" />
                      <div className="flex-1">
                        <span className="text-[11px] font-bold text-navy block">Banner Active</span>
                        <span className="text-[9px] text-text-secondary block">Under 1.5MB</span>
                      </div>
                      <button type="button" onClick={() => handleInputChange('bannerBase64', '')} className="text-red-400 hover:text-red-600 p-1">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => bannerInputRef.current?.click()} className="w-full py-6 bg-white border border-dashed border-navy/15 rounded-xl hover:border-green/40 hover:bg-green/5 transition-all text-center flex flex-col items-center justify-center gap-2">
                      <Upload className="h-5 w-5 text-text-secondary" />
                      <span className="text-xs font-bold text-navy/60">Upload Banner</span>
                    </button>
                  )}
                  <input type="file" ref={bannerInputRef} accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'bannerBase64')} />
                </div>
              </div>
            )}
          </div>

          {/* CARD 5: Invoice Settings */}
          <div className="bg-white border border-navy/5 p-6 md:p-8 rounded-2xl shadow-sm">
            <h3 className="text-sm font-extrabold text-navy pb-3 border-b border-navy/5 mb-5 flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-green" /> Invoice Settings
            </h3>
            
            {!isEditMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                {viewRow('Currency', form.currency, <DollarSign className="h-3.5 w-3.5 text-green" />)}
                {viewRow('Time Zone', form.timeZone, <Clock className="h-3.5 w-3.5 text-green" />)}
                {viewRow('Invoice Prefix', form.invoicePrefix, <FileText className="h-3.5 w-3.5 text-green" />)}
                {viewRow('Invoice Number Format', form.invoiceNumberFormat, <Layout className="h-3.5 w-3.5 text-green" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Currency</label>
                  <select className={selectClass} value={form.currency} onChange={e => handleInputChange('currency', e.target.value)}>
                    {CURRENCIES.map(curr => <option key={curr.value} value={curr.value}>{curr.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Time Zone</label>
                  <select className={selectClass} value={form.timeZone} onChange={e => handleInputChange('timeZone', e.target.value)}>
                    {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Invoice Prefix</label>
                  <input type="text" className={`${inputClass} uppercase`} maxLength={8} placeholder="INV"
                    value={form.invoicePrefix} onChange={e => handleInputChange('invoicePrefix', e.target.value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase())} />
                </div>
                <div>
                  <label className={labelClass}>Invoice Number Format</label>
                  <select className={selectClass} value={form.invoiceNumberFormat} onChange={e => handleInputChange('invoiceNumberFormat', e.target.value)}>
                    {INVOICE_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Bottom aligned buttons in edit mode */}
          {isEditMode && (
            <div className="flex justify-end gap-3 bg-white p-6 rounded-2xl border border-navy/5 shadow-sm">
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-3 rounded-xl text-xs font-extrabold text-navy border border-navy/10 hover:bg-navy/5 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-[#0C4737] hover:bg-[#0A3B2F] text-white px-6 py-3 rounded-xl text-xs font-extrabold transition-all shadow-md disabled:opacity-60 active:scale-98"
              >
                {saving ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> Saving Changes...</>
                ) : (
                  <><Save className="h-4.5 w-4.5" /> Save Changes</>
                )}
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default BusinessProfilePage;
