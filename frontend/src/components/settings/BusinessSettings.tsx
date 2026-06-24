import React, { useState, useRef, useEffect } from 'react';
import API from '../../utils/api';
import { useBusinessProfile, getLogoUrl } from '../../context/BusinessContext';
import { useAuth } from '../../context/AuthContext';
import UpgradeModal from '../common/UpgradeModal';
import {
  Building2, User, Briefcase, MapPin, Upload, X,
  Save, CheckCircle, AlertCircle, Banknote, FileText,
  Shield, BadgePercent, Sparkles, RefreshCw, Globe,
  Clock, IndianRupee, Phone, Bell, Mail, Hash,
  CreditCard, Landmark, QrCode, Settings2,
  CheckCircle2
} from 'lucide-react';
import { usePopup } from '../../context/PopupContext';

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

type TabKey = 'profile' | 'address' | 'branding' | 'invoice' | 'tax' | 'bank' | 'account';

const TABS: { key: TabKey; label: string; icon: React.ElementType; description: string }[] = [
  { key: 'profile',       label: 'Business Profile',   icon: Building2,     description: 'Name, type & contact' },
  { key: 'address',       label: 'Address',            icon: MapPin,        description: 'Location & region' },
  { key: 'branding',      label: 'Branding',           icon: Sparkles,      description: 'Logo & banner assets' },
  { key: 'invoice',       label: 'Invoice Config',     icon: FileText,      description: 'Numbering & currency' },
  { key: 'tax',           label: 'Tax Registry',       icon: BadgePercent,  description: 'GST, PAN & tax IDs' },
  { key: 'bank',          label: 'Bank & Payment',     icon: Banknote,      description: 'Account & UPI details' },
  { key: 'account',       label: 'Account',            icon: User,          description: 'Password & account deletion' },
];

interface BusinessSettingsProps {
  defaultTab?: TabKey;
  hideTabs?: boolean;
}

const BusinessSettings: React.FC<BusinessSettingsProps> = ({ defaultTab = 'profile', hideTabs = false }) => {
  const { businessProfile, refreshBusinessProfile } = useBusinessProfile();
  const { logout } = useAuth();
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);

  // Sync state if defaultTab changes (e.g. switching tabs via sidebar)
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [bannerPreview, setBannerPreview] = useState<string>('');

  // Account settings states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const { showPopup } = usePopup();

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [cancellingSub, setCancellingSub] = useState(false);
  const [reactivatingSub, setReactivatingSub] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleCancelSubscription = async () => {
    setCancellingSub(true);
    try {
      const response = await API.post('/subscription/cancel-subscription');
      await refreshBusinessProfile();
      showPopup({
        title: 'Subscription Cancelled',
        message: response.data.message || 'Auto-renewal turned off successfully.',
        type: 'success'
      });
      setShowCancelModal(false);
    } catch (err: any) {
      showPopup({
        title: 'Cancellation Failed',
        message: err.response?.data?.error || 'Failed to cancel subscription.',
        type: 'error'
      });
    } finally {
      setCancellingSub(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setReactivatingSub(true);
    try {
      const response = await API.post('/subscription/reactivate-subscription');
      await refreshBusinessProfile();
      showPopup({
        title: 'Subscription Reactivated',
        message: response.data.message || 'Auto-renewal reactivated successfully.',
        type: 'success'
      });
    } catch (err: any) {
      showPopup({
        title: 'Reactivation Failed',
        message: err.response?.data?.error || 'Failed to reactivate subscription.',
        type: 'error'
      });
    } finally {
      setReactivatingSub(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      showPopup({
        title: 'Validation Error',
        message: 'All fields are required.',
        type: 'warning'
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showPopup({
        title: 'Validation Error',
        message: 'New passwords do not match.',
        type: 'warning'
      });
      return;
    }

    setPasswordUpdating(true);
    try {
      await API.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      showPopup({
        title: 'Password Updated',
        message: 'Password updated successfully!',
        type: 'success'
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      showPopup({
        title: 'Update Failed',
        message: err.response?.data?.error || 'Failed to update password.',
        type: 'error'
      });
    } finally {
      setPasswordUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      showPopup({
        title: 'Validation Error',
        message: 'Please type DELETE to confirm.',
        type: 'warning'
      });
      return;
    }

    setDeletingAccount(true);
    try {
      await API.delete('/auth/delete-account');
      setShowDeleteModal(false);
      logout();
      window.location.href = '/';
    } catch (err: any) {
      showPopup({
        title: 'Delete Failed',
        message: err.response?.data?.error || 'Failed to delete account.',
        type: 'error'
      });
      setDeletingAccount(false);
    }
  };

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
    if (!form.name.trim()) {
      showPopup({
        title: 'Validation Error',
        message: 'Business name is required.',
        type: 'warning'
      });
      return;
    }
    setSaving(true);
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
      };
      if (businessProfile) { await API.put('/business', payload); }
      else { await API.post('/business', payload); }
      await refreshBusinessProfile();
      showPopup({
        title: 'Settings Saved',
        message: 'Business settings saved successfully!',
        type: 'success'
      });
    } catch (err: any) {
      showPopup({
        title: 'Save Failed',
        message: err.response?.data?.error || 'Failed to save settings. Please try again.',
        type: 'error'
      });
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
    { label: 'Currency',   value: form.currency,     icon: IndianRupee },
    { label: 'GST',        value: form.gstNumber || 'Not set', icon: BadgePercent },
    { label: 'Reminders',  value: businessProfile?.remindersEnabled ? `${businessProfile?.remindersIntervals?.length || 0} active` : 'Disabled', icon: Bell },
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
            <Field label="Currency" icon={IndianRupee}>
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

      case 'account': return (
        <div className="flex flex-col gap-8 text-left animate-fade-in">
          
          {/* Top Grid: Subscription & Password */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            
            {/* Card 1: Subscription & Billing */}
            <div className={`p-6 rounded-3xl border flex flex-col justify-between gap-6 transition-all ${
              businessProfile?.isPro 
                ? 'bg-gradient-to-br from-green/5 via-mint/5 to-white border-green/20 shadow-sm shadow-green/5' 
                : 'bg-[#FAFCFB] border-navy/5 shadow-sm'
            }`}>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-navy flex items-center gap-2">
                    <CreditCard className="h-4.5 w-4.5 text-green" />
                    Subscription & Plan
                  </h4>
                  {businessProfile?.isPro ? (
                    <span className="px-3 py-1 rounded-full text-[10px] font-black bg-green text-white uppercase tracking-wider shadow-sm">
                      PRO PLAN
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-[10px] font-black bg-navy/10 text-navy/60 uppercase tracking-wider">
                      FREE PLAN
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-text-secondary leading-relaxed font-medium">
                  {businessProfile?.isPro 
                    ? "Thank you for supporting BillHouse! You have unlimited access to all premium features." 
                    : "You are currently using the Free tier. Upgrade to unlock full branding controls, automatic payment follow-ups, and financial metrics."}
                </p>

                {/* Plan Metadata */}
                <div className="p-4 bg-white border border-navy/8 rounded-2xl flex flex-col gap-3">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-text-secondary">Current Billing Plan:</span>
                    <span className="text-navy uppercase">
                      {businessProfile?.isPro ? `${businessProfile?.subscriptionPlan} billing` : 'None (Free)'}
                    </span>
                  </div>
                  {businessProfile?.isPro && businessProfile.subscriptionExpiresAt && (
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-text-secondary">
                        {businessProfile.cancelAtPeriodEnd ? "Access Ends On:" : "Next Renewal Date:"}
                      </span>
                      <span className={`font-black ${businessProfile.cancelAtPeriodEnd ? 'text-orange-600' : 'text-green'}`}>
                        {new Date(businessProfile.subscriptionExpiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Feature Checklist */}
                <div className="flex flex-col gap-2 mt-1">
                  <p className="text-[10px] font-extrabold uppercase text-navy/40 tracking-wider">Plan Inclusions</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {[
                      { label: 'Professional Invoices', active: true },
                      { label: 'GST Tax Calculations', active: true },
                      { label: 'Automated Reminders', active: !!businessProfile?.isPro },
                      { label: 'Financial Analytics', active: !!businessProfile?.isPro },
                      { label: 'Custom PDF Branding', active: !!businessProfile?.isPro },
                      { label: 'Priority Support', active: !!businessProfile?.isPro }
                    ].map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-bold text-navy/70 select-none">
                        <span className={`text-sm ${f.active ? 'text-green font-bold' : 'text-navy/20'}`}>
                          {f.active ? '✓' : '○'}
                        </span>
                        <span className={f.active ? 'text-navy font-bold' : 'text-text-secondary line-through opacity-50 font-medium'}>
                          {f.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-navy/5 flex justify-end">
                {businessProfile?.isPro ? (
                  businessProfile.cancelAtPeriodEnd ? (
                    <button
                      type="button"
                      onClick={handleReactivateSubscription}
                      disabled={reactivatingSub}
                      className="bg-green hover:bg-[#2F8F7A] text-white px-5 py-3 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer whitespace-nowrap active:scale-98"
                    >
                      {reactivatingSub ? 'Processing...' : 'Reactivate Auto-Renewal'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowCancelModal(true)}
                      disabled={cancellingSub}
                      className="bg-navy/5 hover:bg-red-500/10 text-navy hover:text-red-500 px-5 py-3 rounded-xl text-xs font-bold transition-all border border-navy/10 hover:border-red-500/20 cursor-pointer whitespace-nowrap active:scale-98"
                    >
                      Turn Off Auto-Renewal
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="w-full sm:w-auto bg-green hover:bg-[#0C4737] text-white px-6 py-3 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer whitespace-nowrap active:scale-98 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Upgrade to Professional
                  </button>
                )}
              </div>
            </div>

            {/* Card 2: Security / Password */}
            <form onSubmit={handlePasswordChange} className="p-6 rounded-3xl border border-navy/5 bg-[#FAFCFB] flex flex-col justify-between gap-5 text-left shadow-sm">
              <div className="flex flex-col gap-4">
                <h4 className="text-sm font-black text-navy flex items-center gap-2">
                  <Shield className="h-4.5 w-4.5 text-green" />
                  Security & Password
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed font-medium">
                  Modify your login password below. Requirements: 8+ characters, uppercase, lowercase, numbers & symbols.
                </p>

                <div className="flex flex-col gap-3.5">
                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Current Password</label>
                    <input
                       id="account-curr-pwd"
                       type="password"
                       className={inputClass}
                       placeholder="••••••••"
                       value={currentPassword}
                       onChange={e => { setCurrentPassword(e.target.value); }}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1">
                      <label className={labelClass}>New Password</label>
                      <input
                        id="account-new-pwd"
                        type="password"
                        className={inputClass}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={e => { setNewPassword(e.target.value); setPasswordError(null); }}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelClass}>Confirm Password</label>
                      <input
                        id="account-conf-pwd"
                        type="password"
                        className={inputClass}
                        placeholder="••••••••"
                        value={confirmNewPassword}
                        onChange={e => { setConfirmNewPassword(e.target.value); setPasswordError(null); }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-navy/5 flex justify-end">
                <button
                  type="submit"
                  disabled={passwordUpdating}
                  className="bg-[#0C4737] hover:bg-[#0A3B2F] text-white px-5 py-3 rounded-xl text-xs font-black transition-all shadow-md disabled:opacity-60 cursor-pointer active:scale-98"
                >
                  {passwordUpdating ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Card 3: Danger Zone */}
          <div className="border border-red-200/50 bg-red-50/5 p-6 rounded-3xl flex flex-col gap-4 text-left shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-500/10 rounded-xl">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h4 className="text-sm font-black text-red-600">Danger Zone</h4>
                <p className="text-[11px] text-navy/40 font-semibold mt-0.5">Permanent account and data removal options.</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white border border-red-100 p-5 rounded-2xl gap-4">
              <div className="max-w-2xl">
                <p className="text-xs font-extrabold text-navy">Permanently Delete Workspace</p>
                <p className="text-[11px] text-text-secondary leading-relaxed font-semibold mt-1">
                  Once initiated, your business profile, invoices, payments, client directory, and user login are completely destroyed. This action is irreversible.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); setDeleteError(null); }}
                className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-xl text-xs font-black transition-all shadow-md hover:shadow-red-500/15 cursor-pointer text-center active:scale-98"
              >
                Delete Account...
              </button>
            </div>
          </div>

          {/* Account Deletion Confirmation Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-[#06121E]/65 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-white rounded-3xl border border-navy/5 shadow-2xl p-6 md:p-8 flex flex-col gap-6 animate-float-fast relative text-left">
                <div>
                  <h3 className="text-lg font-black text-red-600 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Are you absolutely sure?
                  </h3>
                  <p className="text-xs text-text-secondary font-semibold mt-2 leading-relaxed">
                    This action is **irreversible**. It will immediately and permanently delete your user account, business profile, and all related database records (clients, invoices, payments, audit history) for this workspace.
                  </p>
                  <p className="text-xs text-text-secondary font-semibold mt-3">
                    To confirm, please type <strong className="text-red-600 select-none">DELETE</strong> in the box below:
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <input
                    id="delete-account-confirm"
                    type="text"
                    className="w-full bg-white border border-navy/15 rounded-xl px-4 py-2.5 text-xs text-navy font-bold focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 placeholder:text-navy/20"
                    placeholder="Type DELETE"
                    value={deleteConfirmText}
                    onChange={e => { setDeleteConfirmText(e.target.value); }}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deletingAccount}
                    className="flex-1 py-3 text-xs font-bold border border-navy/15 text-navy hover:bg-navy/5 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deletingAccount || deleteConfirmText !== 'DELETE'}
                    className="flex-1 py-3 text-xs font-black bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {deletingAccount ? 'Purging Data...' : 'Confirm Purge'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pro Subscription Cancellation Confirmation Modal */}
          {showCancelModal && (
            <div className="fixed inset-0 bg-[#06121E]/65 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-white rounded-3xl border border-navy/5 shadow-2xl p-6 md:p-8 flex flex-col gap-6 animate-float-fast relative text-left">
                <div>
                  <h3 className="text-lg font-black text-navy flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-green" />
                    Turn Off Auto-Renewal?
                  </h3>
                  <p className="text-xs text-text-secondary font-semibold mt-2 leading-relaxed">
                    Are you sure you want to turn off auto-renewal for your Pro subscription?
                  </p>
                  <p className="text-xs text-text-secondary font-semibold mt-3 leading-relaxed">
                    Your account will remain **Pro** with all features (reports, automated reminders, custom logos) fully unlocked until the end of your paid billing period on <strong className="text-navy">{businessProfile?.subscriptionExpiresAt ? new Date(businessProfile.subscriptionExpiresAt).toLocaleDateString() : 'expiry date'}</strong>. 
                  </p>
                  <p className="text-xs text-text-secondary font-semibold mt-2 leading-relaxed">
                    After this date, your business profile will be automatically downgraded to the Free Plan.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(false)}
                    disabled={cancellingSub}
                    className="flex-1 py-3 text-xs font-bold border border-navy/15 text-navy hover:bg-navy/5 rounded-xl transition-all cursor-pointer"
                  >
                    Keep Auto-Renew On
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelSubscription}
                    disabled={cancellingSub}
                    className="flex-1 py-3 text-xs font-black bg-navy hover:bg-[#0A3B2F] text-white rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {cancellingSub ? 'Processing...' : 'Turn Off Auto-Renewal'}
                  </button>
                </div>
              </div>
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
          {activeTab !== 'account' && (
            <button id="settings-save-btn" onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-[#0C4737] hover:bg-[#0A3B2F] text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-md disabled:opacity-60 w-full sm:w-auto justify-center">
              {saving
                ? <><RefreshCw className="h-4 w-4 animate-spin" /> Saving...</>
                : <><Save className="h-4 w-4" /> Save Changes</>
              }
            </button>
          )}
        </div>
      </div>

      {/* Alerts are handled by global usePopup */}

      {/* ── Main Content: Horizontal tabs + Panel ──────── */}
      <div className="flex flex-col gap-4">

        {/* Horizontal tab bar */}
        {!hideTabs && (
          <div className="bg-white border border-navy/5 rounded-2xl shadow-sm p-1.5 overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {TABS.filter(tab => tab.key !== 'account').map(tab => {
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
        )}

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
          {activeTab !== 'account' && (
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
          )}
        </div>
      </div>

      {/* Upgrade Checkout Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onSuccess={() => {
          refreshBusinessProfile();
          setSuccessMsg("Congratulations! You have successfully upgraded to the Pro plan.");
          setTimeout(() => setSuccessMsg(null), 4000);
        }}
      />
    </div>
  );
};

export default BusinessSettings;
