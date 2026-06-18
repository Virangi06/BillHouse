import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../../utils/api';
import Button from '../common/Button';
import GlassCard from '../common/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { useBusinessProfile, getLogoUrl } from '../../context/BusinessContext';
import {
  ChevronLeft,
  Edit2,
  Copy,
  Printer,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  Building,
  User
} from 'lucide-react';

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  unit: 'hours' | 'days' | 'months' | 'items' | 'projects';
  gstRate: number;
  amount: number;
  _id?: string;
}

interface InvoiceDetailData {
  _id: string;
  number: string;
  client: string;
  clientName: string;
  date: string;
  dueDate: string;
  status: 'Draft' | 'Sent' | 'Viewed' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';
  subtotal: number;
  gstAmount: number;
  discountAmount: number;
  tdsRate: number;
  tdsAmount: number;
  template: 'Modern' | 'Classic' | 'Minimal';
  colorTheme: string;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  notes?: string;
  terms?: string;
  currency: string;
  items: InvoiceItem[];
  createdAt?: string;
  sentAt?: string;
  paidAt?: string;
}

interface ClientDetail {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  taxId?: string;
  address?: string;
}

export const InvoiceDetail: React.FC = () => {
  const { user } = useAuth();
  const { businessProfile } = useBusinessProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const invoiceId = searchParams.get('id');

  const [invoice, setInvoice] = useState<InvoiceDetailData | null>(null);
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchInvoiceDetails = async () => {
    if (!invoiceId) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await API.get<InvoiceDetailData>(`/invoices/${invoiceId}`);
      
      let invoiceData = res.data;
      if (invoiceData.status === 'Draft' || invoiceData.status === 'Sent') {
        try {
          const viewRes = await API.patch<{ message: string; invoice: InvoiceDetailData }>(`/invoices/${invoiceId}/view`);
          if (viewRes.data?.invoice) {
            invoiceData = viewRes.data.invoice;
          }
        } catch (viewErr) {
          console.warn('Failed to auto-mark invoice as viewed:', viewErr);
        }
      }
      
      setInvoice(invoiceData);

      // Fetch client billing info
      try {
        const clientRes = await API.get<ClientDetail>(`/clients/${invoiceData.client}`);
        setClient(clientRes.data);
      } catch (clientErr) {
        console.warn('Failed to load full client details for invoice sheet, falling back to invoice fields', clientErr);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Failed to retrieve invoice statement details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceDetails();
  }, [invoiceId]);

  const handleStatusChange = async (newStatus: 'Draft' | 'Sent' | 'Viewed' | 'Partially Paid' | 'Paid' | 'Cancelled') => {
    if (!invoice) return;
    try {
      setActionLoading(true);
      setErrorMsg(null);
      const res = await API.patch<{ message: string; invoice: InvoiceDetailData }>(`/invoices/${invoice._id}/status`, { status: newStatus });
      if (res.data?.invoice) {
        setInvoice(res.data.invoice);
      } else {
        setInvoice(prev => prev ? {
          ...prev,
          status: newStatus,
          amountPaid: newStatus === 'Paid' ? prev.totalAmount : (newStatus === 'Partially Paid' ? Math.round(prev.totalAmount / 2) : 0),
          amountDue: newStatus === 'Paid' ? 0 : (newStatus === 'Partially Paid' ? prev.totalAmount - Math.round(prev.totalAmount / 2) : prev.totalAmount)
        } : null);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error
        || (err.message === 'Network Error' ? 'Network error – check that the backend server is running and CORS allows PATCH requests.' : null)
        || 'Failed to update invoice status';
      setErrorMsg(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (!invoice) return;
    if (!window.confirm('Do you want to duplicate this invoice? This will draft a new copy.')) {
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        clientId: invoice.client,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        discountAmount: invoice.discountAmount,
        notes: invoice.notes,
        terms: invoice.terms,
        items: invoice.items.map(it => ({
          description: it.description,
          quantity: it.quantity,
          rate: it.rate,
          gstRate: it.gstRate
        })),
        status: 'Draft'
      };

      const res = await API.post('/invoices', payload);
      alert('Invoice duplicated successfully! Redirecting to the new draft.');
      setSearchParams({ tab: 'invoices', action: 'detail', id: res.data.invoice._id });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to duplicate invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;
    if (!window.confirm('Are you absolutely sure you want to permanently delete this invoice?')) {
      return;
    }

    try {
      setActionLoading(true);
      await API.delete(`/invoices/${invoice._id}`);
      setSearchParams({ tab: 'invoices' });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green/10 text-green-dark border border-green/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Paid
          </span>
        );
      case 'Sent':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
            <Clock className="h-3.5 w-3.5" />
            Sent
          </span>
        );
      case 'Viewed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-700 border border-blue-500/20">
            <Clock className="h-3.5 w-3.5" />
            Viewed
          </span>
        );
      case 'Partially Paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-700 border border-indigo-500/20">
            <Clock className="h-3.5 w-3.5" />
            Partially Paid
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-700 border border-rose-500/20 animate-pulse">
            <AlertCircle className="h-3.5 w-3.5" />
            Overdue
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-500/10 text-gray-700 border border-gray-500/20">
            <XCircle className="h-3.5 w-3.5" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-navy/10 text-navy/70 border border-navy/15">
            <FileText className="h-3.5 w-3.5" />
            Draft
          </span>
        );
    }
  };

  const getStatusBarColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'border-l-[6px] md:border-l-[8px] border-green';
      case 'Sent': return 'border-l-[6px] md:border-l-[8px] border-amber-500';
      case 'Viewed': return 'border-l-[6px] md:border-l-[8px] border-blue-500';
      case 'Partially Paid': return 'border-l-[6px] md:border-l-[8px] border-indigo-500';
      case 'Overdue': return 'border-l-[6px] md:border-l-[8px] border-rose-500';
      case 'Cancelled': return 'border-l-[6px] md:border-l-[8px] border-gray-400';
      default: return 'border-l-[6px] md:border-l-[8px] border-navy/30';
    }
  };

  const renderStatusTimeline = () => {
    if (!invoice) return null;
    const { status } = invoice;
    
    const isSent = ['Sent', 'Viewed', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'].includes(status);
    const isPaid = status === 'Paid';
    
    return (
      <GlassCard className="p-5 border-navy/5 bg-white shadow-sm flex flex-col gap-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-secondary border-b border-navy/5 pb-2">Status Timeline</h3>
        <div className="flex flex-col gap-4">
          {/* Step 1: Draft */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="h-6 w-6 rounded-full bg-green text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                ✓
              </div>
              <div className="w-0.5 h-8 bg-green"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-extrabold text-navy">Draft Compiled</span>
              <span className="text-[10px] text-text-secondary font-semibold">Invoice created successfully</span>
            </div>
          </div>

          {/* Step 2: Sent / Viewed */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border-2 ${
                isSent 
                  ? 'bg-green border-green text-white' 
                  : 'bg-white border-navy/15 text-text-secondary'
              }`}>
                {isSent ? '✓' : '2'}
              </div>
              <div className={`w-0.5 h-8 ${isPaid ? 'bg-green' : 'bg-navy/10'}`}></div>
            </div>
            <div className="flex flex-col">
              <span className={`text-xs font-extrabold ${isSent ? 'text-navy' : 'text-text-secondary'}`}>
                {status === 'Viewed' ? 'Viewed by Client' : status === 'Partially Paid' ? 'Partially Settled' : 'Dispatched to Client'}
              </span>
              <span className="text-[10px] text-text-secondary font-semibold">
                {status === 'Viewed' 
                  ? 'Client has opened invoice' 
                  : status === 'Partially Paid' 
                    ? `Partially paid: ${formatCurrency(invoice.amountPaid)} received` 
                    : isSent 
                      ? 'Sent to recipient email' 
                      : 'Pending dispatch'}
              </span>
            </div>
          </div>

          {/* Step 3: Paid */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border-2 ${
                isPaid 
                  ? 'bg-green border-green text-white' 
                  : 'bg-white border-navy/15 text-text-secondary'
              }`}>
                {isPaid ? '✓' : '3'}
              </div>
            </div>
            <div className="flex flex-col">
              <span className={`text-xs font-extrabold ${isPaid ? 'text-navy' : 'text-text-secondary'}`}>Payment Cleared</span>
              <span className="text-[10px] text-text-secondary font-semibold">
                {isPaid ? 'Settled in full' : 'Awaiting payment confirmation'}
              </span>
            </div>
          </div>
        </div>
      </GlassCard>
    );
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green"></div>
        <p className="text-xs text-text-secondary font-bold">Loading invoice parameters...</p>
      </div>
    );
  }

  if (errorMsg || !invoice) {
    return (
      <div className="p-8 max-w-lg mx-auto bg-danger/10 border border-danger/35 text-danger text-xs font-bold rounded-2xl flex flex-col gap-3 items-center text-center">
        <AlertCircle className="h-8 w-8 text-danger" />
        <div>
          <h3 className="font-extrabold text-sm">Access Denied / Error</h3>
          <p className="mt-1 font-semibold">{errorMsg || 'We could not fetch details for this invoice.'}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setSearchParams({ tab: 'invoices' })}
          className="mt-2 text-xs font-bold border-danger/35 text-danger hover:bg-danger/5"
        >
          Return to Registry
        </Button>
      </div>
    );
  }

  const businessName = user?.name ? `${user.name.split(' ')[0]}'s Org` : 'BillHouse Partner';

  return (
    <div className="flex flex-col gap-6 w-full max-w-full">
      {/* 1. Page Header (actions bar on mobile, standard header on desktop) - Hidden during print */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-navy/5 p-4.5 rounded-2xl shadow-sm gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSearchParams({ tab: 'invoices' })}
            className="p-2 bg-white border border-navy/10 rounded-xl text-navy hover:bg-navy/5 transition-all shadow-sm"
            title="Back to Registry"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-navy">{invoice.number}</h2>
              {getStatusBadge(invoice.status)}
            </div>
            <span className="text-[10px] text-text-secondary font-bold mt-0.5">₹ INR Tax Invoicing System</span>
          </div>
        </div>

        {/* Quick mobile/tablet print & edit actions */}
        <div className="flex sm:hidden gap-2 w-full">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 border-navy/15 text-navy"
          >
            <Printer className="h-4 w-4" /> Print
          </Button>
          {invoice.status === 'Draft' && (
            <Button
              variant="outline"
              onClick={() => setSearchParams({ tab: 'invoices', action: 'edit', id: invoice._id })}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 border-green/30 text-green"
            >
              <Edit2 className="h-4 w-4" /> Edit
            </Button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/35 text-red-700 text-xs font-bold rounded-2xl flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="p-1 hover:bg-red-500/10 rounded-lg shrink-0">✕</button>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
        {/* Left Side: Printable Invoice (2/3 width on desktop) */}
        <div className="lg:col-span-8 w-full flex justify-center">
          <GlassCard className="printable-invoice-card p-6 sm:p-10 md:p-12 bg-white text-navy shadow-md print:shadow-none print:border-none print:p-0 print:m-0 flex flex-col gap-6 md:gap-8 w-full max-w-4xl overflow-hidden">
            {/* Invoice Header */}
            {invoice.template === 'Classic' ? (
              <div className="flex flex-col gap-6">
                <div 
                  className="flex justify-between items-center p-4 rounded-xl text-white shadow-sm"
                  style={{ backgroundColor: invoice.colorTheme }}
                >
                  <h1 className="text-lg font-black tracking-widest uppercase m-0">Tax Invoice</h1>
                  <span className="text-sm font-extrabold">No: {invoice.number}</span>
                </div>
                <div 
                  className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-5"
                  style={{ borderBottom: `1px solid ${invoice.colorTheme}40` }}
                >
                  <div className="flex items-center gap-3">
                    {businessProfile?.logoBase64 ? (
                      <img src={getLogoUrl(businessProfile.logoBase64)} alt={businessProfile.name} className="h-12 w-auto object-contain" />
                    ) : (
                      <div className="h-12 w-12 text-white rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: invoice.colorTheme }}>
                        <Building className="h-6 w-6" />
                      </div>
                    )}
                    <div className="text-xs text-[#5f6b76] font-semibold leading-normal">
                      <h3 className="font-extrabold text-navy text-[13px]">{businessProfile?.name || businessName}</h3>
                      <p>
                        {businessProfile?.address ? (
                          <>{businessProfile.address}{businessProfile.city && `, ${businessProfile.city}`}{businessProfile.state && `, ${businessProfile.state}`}{businessProfile.pincode && ` - ${businessProfile.pincode}`}</>
                        ) : (
                          "Street Address, City, Country, Zip Code"
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right flex flex-col gap-1 text-xs">
                    <span className="text-[#5f6b76] font-semibold">Issue Date: <span className="font-bold text-navy">{formatDate(invoice.date)}</span></span>
                    <span className="text-[#5f6b76] font-semibold">Due Date: <span className="font-bold text-navy">{formatDate(invoice.dueDate)}</span></span>
                  </div>
                </div>
              </div>
            ) : invoice.template === 'Minimal' ? (
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-navy uppercase m-0">Invoice</h1>
                    <span className="text-xs text-text-secondary font-semibold">#{invoice.number}</span>
                  </div>
                  {businessProfile?.logoBase64 ? (
                    <img src={getLogoUrl(businessProfile.logoBase64)} alt={businessProfile.name} className="h-9 w-auto object-contain" />
                  ) : (
                    <span className="text-xs font-bold text-navy uppercase tracking-wider">{businessProfile?.name || businessName}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-[11px] text-[#5f6b76] font-medium pt-2">
                  <div>
                    <p className="font-bold text-navy">{businessProfile?.name || businessName}</p>
                    <p>{businessProfile?.address}</p>
                  </div>
                  <div className="text-right">
                    <p>Issue Date: {formatDate(invoice.date)}</p>
                    <p>Due Date: {formatDate(invoice.dueDate)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-5"
                style={{ borderBottom: `3px solid ${invoice.colorTheme}` }}
              >
                <div className="flex items-center gap-3">
                  {businessProfile?.logoBase64 ? (
                    <img src={getLogoUrl(businessProfile.logoBase64)} alt={businessProfile.name} className="h-12 w-auto object-contain" />
                  ) : (
                    <div className="h-12 w-12 text-white rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: invoice.colorTheme }}>
                      <Building className="h-6 w-6" />
                    </div>
                  )}
                  <div className="text-xs text-[#5f6b76] font-semibold leading-normal">
                    <h3 className="font-extrabold text-navy text-[13px]">{businessProfile?.name || businessName}</h3>
                    <p>
                      {businessProfile?.address ? (
                        <>{businessProfile.address}{businessProfile.city && `, ${businessProfile.city}`}{businessProfile.state && `, ${businessProfile.state}`}{businessProfile.pincode && ` - ${businessProfile.pincode}`}</>
                      ) : (
                        "Street Address, City, Country, Zip Code"
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right flex flex-col gap-1 text-xs w-full sm:w-auto">
                  <span className="text-[#5f6b76] font-semibold">Invoice# <span className="font-bold text-navy">{invoice.number}</span></span>
                  <span className="text-[#5f6b76] font-semibold">Issue date</span>
                  <span className="font-bold text-navy">{formatDate(invoice.date)}</span>
                </div>
              </div>
            )}

            {/* Business Large Display Header (Hide for Minimal) */}
            {invoice.template !== 'Minimal' && (
              <div className="flex flex-col gap-1 mt-2">
                <h2 className="text-xl font-bold text-navy tracking-tight">{businessProfile?.name || businessName}</h2>
                <p className="text-xs text-[#5f6b76] font-medium leading-relaxed whitespace-pre-wrap">
                  {invoice.notes || "Add a message here for your customer."}
                </p>
              </div>
            )}

            {/* Three-Column Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 pb-2 text-xs">
              {/* Col 1: BILL TO */}
              <div className="flex flex-col gap-1.5 leading-relaxed">
                <h4 
                  className="font-black text-[10px] text-[#5f6b76] uppercase tracking-wider pb-1"
                  style={{ borderBottom: `1px solid ${invoice.template === 'Minimal' ? '#e2e8f0' : `${invoice.colorTheme}20`}` }}
                >
                  BILL TO
                </h4>
                <div>
                  <p className="font-extrabold text-navy text-[13px]">{invoice.clientName}</p>
                  {client ? (
                    <div className="text-[#5f6b76] font-semibold mt-1 flex flex-col gap-0.5">
                      <p>{client.address || 'Billing address not provided'}</p>
                      {client.phone && <p>Phone: {client.phone}</p>}
                      <p>Email: {client.email}</p>
                      {client.taxId && <p className="font-bold text-navy mt-1">GSTIN: {client.taxId}</p>}
                    </div>
                  ) : (
                    <p className="text-[#5f6b76] mt-1">Loading client billing details...</p>
                  )}
                </div>
              </div>

              {/* Col 2: DETAILS */}
              <div 
                className="flex flex-col gap-1.5 leading-relaxed border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6"
                style={{ borderLeftColor: invoice.template === 'Minimal' ? 'transparent' : `${invoice.colorTheme}15` }}
              >
                <h4 
                  className="font-black text-[10px] text-[#5f6b76] uppercase tracking-wider pb-1"
                  style={{ borderBottom: `1px solid ${invoice.template === 'Minimal' ? '#e2e8f0' : `${invoice.colorTheme}20`}` }}
                >
                  DETAILS
                </h4>
                <div className="text-[#5f6b76] font-semibold flex flex-col gap-1">
                  {invoice.terms ? (
                    <p className="whitespace-pre-wrap">{invoice.terms}</p>
                  ) : (
                    <p className="italic text-[11px]">No custom terms or project details specified for this statement.</p>
                  )}
                  {businessProfile?.gstNumber && <p className="font-bold text-navy mt-1">Sender GSTIN: {businessProfile.gstNumber}</p>}
                  {businessProfile?.panNumber && <p className="font-bold text-navy">Sender PAN: {businessProfile.panNumber}</p>}
                </div>
              </div>

              {/* Col 3: PAYMENT */}
              <div 
                className="flex flex-col gap-1.5 leading-relaxed border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6"
                style={{ borderLeftColor: invoice.template === 'Minimal' ? 'transparent' : `${invoice.colorTheme}15` }}
              >
                <h4 
                  className="font-black text-[10px] text-[#5f6b76] uppercase tracking-wider pb-1"
                  style={{ borderBottom: `1px solid ${invoice.template === 'Minimal' ? '#e2e8f0' : `${invoice.colorTheme}20`}` }}
                >
                  PAYMENT
                </h4>
                <div className="text-[#5f6b76] font-semibold flex flex-col gap-1">
                  <div className="flex flex-col">
                    <span>Due date</span>
                    <span className="font-bold text-navy mt-0.5">{formatDate(invoice.dueDate)}</span>
                  </div>
                  <div className="flex flex-col mt-2">
                    <span>Due Amount</span>
                    <span className="text-base font-black text-navy mt-0.5">{formatCurrency(invoice.amountDue)}</span>
                  </div>
                  {/* Render compact bank details under payment info */}
                  {businessProfile && (businessProfile.bankName || businessProfile.bankAccount) && (
                    <div 
                      className="mt-2 pt-2 border-t text-[10px] leading-tight flex flex-col gap-0.5"
                      style={{ borderTopColor: `${invoice.colorTheme}15` }}
                    >
                      <p className="font-bold text-navy">Bank Details:</p>
                      {businessProfile.bankName && <p>{businessProfile.bankName}</p>}
                      {businessProfile.bankAccount && <p>A/C: {businessProfile.bankAccount}</p>}
                      {businessProfile.bankIfsc && <p>IFSC: {businessProfile.bankIfsc}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto w-full -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full text-left border-collapse min-w-[560px]">
                <thead>
                  <tr 
                    style={{ borderBottom: `2px solid ${invoice.template === 'Minimal' ? '#e2e8f0' : invoice.colorTheme}` }}
                    className="text-[10px] font-black uppercase text-[#5f6b76] tracking-wider"
                  >
                    <th className="py-2.5 pr-4 w-7/12">Item</th>
                    <th className="py-2.5 px-4 text-right w-1/12">Qty</th>
                    <th className="py-2.5 px-4 text-right w-2/12">Price</th>
                    <th className="py-2.5 pl-4 text-right w-2/12">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {invoice.items.map((item, idx) => (
                    <tr key={item._id || idx} className="text-xs font-semibold hover:bg-slate-50/30 transition-colors">
                      <td className="py-3.5 pr-4 text-navy">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-[13px]">{item.description}</span>
                          <span className="text-[10px] text-[#5f6b76] mt-0.5 font-medium">GST Rate: {item.gstRate}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right text-navy font-semibold align-top whitespace-nowrap">
                        {item.quantity} <span className="text-[10px] text-[#5f6b76] font-normal">{item.unit ? (item.unit === 'hours' ? 'hrs' : item.unit === 'projects' ? 'proj' : item.unit === 'items' ? 'pcs' : item.unit === 'days' ? 'days' : 'mos') : 'pcs'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#5f6b76] font-semibold align-top">
                        {formatCurrency(item.rate)}
                      </td>
                      <td className="py-3.5 pl-4 text-right text-navy font-black align-top">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary calculations block */}
            <div className="flex justify-end pt-2">
              <div className="w-full md:w-80 flex flex-col gap-2.5 text-xs text-navy font-semibold">
                <div className="flex justify-between items-center text-[#5f6b76]">
                  <span>Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>

                <div className="flex justify-between items-center text-[#5f6b76]">
                  <span>Tax</span>
                  <span>{formatCurrency(invoice.gstAmount)}</span>
                </div>

                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-red-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(invoice.discountAmount)}</span>
                  </div>
                )}

                <div 
                  className="flex justify-between items-center text-[13px] font-black text-navy pt-2 pb-2"
                  style={{ 
                    borderTop: `1px solid ${invoice.template === 'Minimal' ? '#e2e8f0' : invoice.colorTheme}`, 
                    borderBottom: `1px solid ${invoice.template === 'Minimal' ? '#e2e8f0' : invoice.colorTheme}` 
                  }}
                >
                  <span>Total Due</span>
                  <span className="text-base font-black">{formatCurrency(invoice.totalAmount)}</span>
                </div>

                {invoice.tdsRate > 0 && (
                  <div 
                    className="p-2.5 bg-slate-50 border rounded-xl text-[11px] font-semibold text-text-secondary leading-normal text-right mt-1.5"
                    style={{ borderColor: invoice.template === 'Minimal' ? '#e2e8f0' : `${invoice.colorTheme}25` }}
                  >
                    <p className="font-bold text-navy">
                      Estimated TDS ({invoice.tdsRate}%): {formatCurrency(invoice.tdsAmount)}
                    </p>
                    <p className="text-[9px] text-[#5f6b76] italic mt-0.5">
                      *Estimated TDS deduction at payment: {formatCurrency(invoice.tdsAmount)} (to be deducted by client)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Printable Footer */}
            <div className="hidden print:flex justify-between items-end border-t border-navy/10 pt-4 mt-auto text-[9px] text-[#5f6b76] font-semibold w-full">
              <div className="max-w-[70%]">
                <p>Thank you for choosing BillHouse. If you have any questions or concerns regarding this invoice statement, please contact us.</p>
                <p className="mt-0.5 text-navy">Powered by BillHouse Tax Invoicing System.</p>
              </div>
              <span className="shrink-0 text-right">Page 1</span>
            </div>
          </GlassCard>
        </div>

        {/* Right Side: Sidebar Actions Panel (1/3 width, stacks below on mobile/tablet) */}
        <div className="lg:col-span-4 w-full flex flex-col gap-6 print:hidden">
          {/* Status Timeline Widget */}
          {renderStatusTimeline()}

          {/* Action Trigger Card */}
          <GlassCard className="p-6 border-navy/5 bg-white shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-extrabold text-navy border-b border-navy/5 pb-2">Invoice Actions</h3>
            <div className="flex flex-col gap-2.5 w-full">
              <Button
                variant="primary"
                disabled={actionLoading}
                onClick={handlePrint}
                className="w-full py-3 text-xs font-black shadow-md bg-green hover:bg-green-dark text-white rounded-xl flex items-center justify-center gap-2"
              >
                <Printer className="h-4.5 w-4.5" />
                Print / Save PDF
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  disabled={actionLoading}
                  onClick={handleDuplicate}
                  className="w-full py-2.5 text-xs font-bold border-navy/15 text-navy hover:bg-navy/5 rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </Button>

                {invoice.status === 'Draft' ? (
                  <Button
                    variant="outline"
                    disabled={actionLoading}
                    onClick={() => setSearchParams({ tab: 'invoices', action: 'edit', id: invoice._id })}
                    className="w-full py-2.5 text-xs font-bold border-green/30 text-green hover:bg-green/5 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Draft
                  </Button>
                ) : (
                  <button
                    disabled
                    className="w-full py-2.5 text-xs font-bold border border-navy/5 bg-navy/5 text-navy/30 rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    Immutable
                  </button>
                )}
              </div>
            </div>
          </GlassCard>

          {/* Quick Status Workflow transitions */}
          <GlassCard className="p-6 border-navy/5 bg-white shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-extrabold text-navy border-b border-navy/5 pb-2">Status Workflow</h3>
            <div className="flex flex-col gap-2.5">
              {invoice.status === 'Draft' && (
                <Button
                  variant="primary"
                  disabled={actionLoading}
                  onClick={() => handleStatusChange('Sent')}
                  className="w-full py-2.5 text-xs font-bold bg-navy text-white hover:bg-navy/90 rounded-xl"
                >
                  Mark as Sent / Dispatched
                </Button>
              )}

              {['Draft', 'Sent', 'Viewed'].includes(invoice.status) && (
                <Button
                  variant="outline"
                  disabled={actionLoading}
                  onClick={() => handleStatusChange('Partially Paid')}
                  className="w-full py-2.5 text-xs font-bold border-indigo-500/25 text-indigo-700 hover:bg-indigo-500/5 rounded-xl"
                >
                  Mark as Partially Paid
                </Button>
              )}

              {['Draft', 'Sent', 'Viewed', 'Partially Paid'].includes(invoice.status) && (
                <Button
                  variant="secondary"
                  disabled={actionLoading}
                  onClick={() => handleStatusChange('Paid')}
                  className="w-full py-2.5 text-xs font-black bg-[#0C4737] hover:bg-green-dark text-white rounded-xl"
                >
                  Mark as Paid / Settled
                </Button>
              )}

              {invoice.status !== 'Paid' && invoice.status !== 'Cancelled' && (
                <Button
                  variant="outline"
                  disabled={actionLoading}
                  onClick={() => handleStatusChange('Cancelled')}
                  className="w-full py-2.5 text-xs font-bold text-red-500 border-red-500/20 hover:bg-red-500/5 hover:border-red-500/40 rounded-xl"
                >
                  Cancel Invoice Statement
                </Button>
              )}

              {invoice.status !== 'Paid' && (
                <Button
                  variant="ghost"
                  disabled={actionLoading}
                  onClick={handleDelete}
                  className="w-full py-2.5 text-xs font-bold text-text-secondary hover:text-red-600 hover:bg-red-500/5 rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  Permanently Delete
                </Button>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
