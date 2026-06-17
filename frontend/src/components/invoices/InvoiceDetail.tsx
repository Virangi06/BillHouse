import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../../utils/api';
import Button from '../common/Button';
import GlassCard from '../common/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { useBusinessProfile } from '../../context/BusinessContext';
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
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  subtotal: number;
  gstAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  notes?: string;
  terms?: string;
  currency: string;
  items: InvoiceItem[];
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
      setInvoice(res.data);

      // Fetch client billing info
      try {
        const clientRes = await API.get<ClientDetail>(`/clients/${res.data.client}`);
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

  const handleStatusChange = async (newStatus: 'Draft' | 'Sent' | 'Paid' | 'Cancelled') => {
    if (!invoice) return;
    try {
      setActionLoading(true);
      setErrorMsg(null);
      await API.patch(`/invoices/${invoice._id}/status`, { status: newStatus });
      setInvoice(prev => prev ? {
        ...prev,
        status: newStatus,
        amountPaid: newStatus === 'Paid' ? prev.totalAmount : 0,
        amountDue: newStatus === 'Paid' ? 0 : prev.totalAmount
      } : null);
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

  const businessName = user?.name ? `${user.name.split(' ')[0]}'s Org` : 'BillHouse Partner';  return (
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

        {/* Quick mobile print & edit actions */}
        <div className="flex sm:hidden gap-2 w-full">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 border-navy/15 text-navy"
          >
            <Printer className="h-4 w-4" /> Print
          </Button>
          {invoice.status === 'Draft' && (
            <Button
              variant="outline"
              onClick={() => setSearchParams({ tab: 'invoices', action: 'edit', id: invoice._id })}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 border-green/30 text-green"
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
        {/* Left Side: Printable Invoice (2/3 width) */}
        <div className="lg:col-span-8 w-full flex justify-center">
          <GlassCard className="p-8 sm:p-12 border-navy/5 bg-white text-navy shadow-md print:shadow-none print:border-none print:p-0 print:m-0 flex flex-col gap-10 w-full max-w-4xl">
            {/* Invoice Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-navy/10 pb-8">
              <div className="flex flex-col gap-2">
                {businessProfile?.logoBase64 ? (
                  <img src={businessProfile.logoBase64} alt={businessProfile.name} className="h-12 w-auto object-contain mb-1" />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    <span className="text-lg font-black tracking-tight text-navy uppercase">
                      {businessProfile?.name || 'BillHouse'}
                    </span>
                  </div>
                )}
                <div className="text-xs text-text-secondary font-semibold leading-relaxed">
                  <p className="font-extrabold text-navy text-sm">{businessProfile?.name || businessName}</p>
                  <p>{businessProfile?.email || user?.email}</p>
                  {businessProfile?.phone && <p>{businessProfile.phone}</p>}
                  {businessProfile?.address ? (
                    <p>
                      {businessProfile.address}
                      {businessProfile.city && `, ${businessProfile.city}`}
                      {businessProfile.state && `, ${businessProfile.state}`}
                      {businessProfile.pincode && ` - ${businessProfile.pincode}`}
                    </p>
                  ) : (
                    <p>Mumbai, Maharashtra, India</p>
                  )}
                  {businessProfile?.gstNumber && <p className="font-bold text-navy mt-1">GSTIN: {businessProfile.gstNumber}</p>}
                  {businessProfile?.panNumber && <p className="font-bold text-navy">PAN: {businessProfile.panNumber}</p>}
                </div>
              </div>

              <div className="flex flex-col sm:items-end text-left sm:text-right gap-1">
                <h1 className="text-2xl font-black text-navy uppercase tracking-wider">TAX INVOICE</h1>
                <span className="text-sm font-extrabold text-green">{invoice.number}</span>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-4 text-xs font-semibold">
                  <span className="text-text-secondary">Issue Date:</span>
                  <span className="text-navy">{formatDate(invoice.date)}</span>
                  <span className="text-text-secondary">Due Date:</span>
                  <span className="text-navy">{formatDate(invoice.dueDate)}</span>
                  <span className="text-text-secondary">Currency:</span>
                  <span className="text-navy">INR (₹)</span>
                </div>
              </div>
            </div>

            {/* Client Billing Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-navy/5 border border-navy/10 rounded-2xl p-6">
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-green" />
                  Billed To
                </h3>
                <div className="text-sm">
                  <p className="font-extrabold text-navy">{invoice.clientName}</p>
                  {client ? (
                    <div className="text-xs text-text-secondary font-semibold mt-1.5 flex flex-col gap-1 leading-relaxed">
                      <p>{client.address || 'Billing address not provided'}</p>
                      {client.phone && <p>📞 {client.phone}</p>}
                      <p>✉ {client.email}</p>
                      {client.taxId && <p className="mt-1 font-bold text-navy">GSTIN: {client.taxId}</p>}
                    </div>
                  ) : (
                    <p className="text-xs text-text-secondary font-semibold mt-1">Fetching client registry contact data...</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t md:border-t-0 md:border-l border-navy/10 pt-4 md:pt-0 md:pl-6">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <User className="h-4 w-4 text-green" />
                  Client Representative
                </h3>
                <div className="text-sm">
                  <p className="font-bold text-navy">{client?.name || invoice.clientName}</p>
                  <p className="text-xs text-text-secondary font-semibold mt-1">✉ {client?.email}</p>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="flex flex-col">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-navy/10 text-xs font-extrabold uppercase text-text-secondary tracking-wider">
                    <th className="py-3 pr-4">Description</th>
                    <th className="py-3 px-4 text-right">Qty</th>
                    <th className="py-3 px-4 text-right">Rate</th>
                    <th className="py-3 px-4 text-right">GST %</th>
                    <th className="py-3 pl-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, idx) => (
                    <tr key={item._id || idx} className="border-b border-navy/5 text-sm font-semibold">
                      <td className="py-4 pr-4 text-navy font-bold leading-normal">
                        {item.description}
                      </td>
                      <td className="py-4 px-4 text-right text-text-secondary font-medium">
                        {item.quantity}
                      </td>
                      <td className="py-4 px-4 text-right text-navy font-medium">
                        {formatCurrency(item.rate)}
                      </td>
                      <td className="py-4 px-4 text-right text-text-secondary font-medium">
                        {item.gstRate}%
                      </td>
                      <td className="py-4 pl-4 text-right text-navy font-bold">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Sheet & Summary */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 pt-4">
              {/* Notes & Bank Details info */}
              <div className="flex flex-col gap-6 w-full md:max-w-md text-xs font-semibold leading-relaxed">
                {invoice.notes && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Invoice Notes</span>
                    <p className="text-navy bg-navy/5 p-4.5 rounded-2xl border border-navy/5 whitespace-pre-wrap">{invoice.notes}</p>
                  </div>
                )}

                {invoice.terms && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Terms & Conditions</span>
                    <p className="text-text-secondary whitespace-pre-wrap">{invoice.terms}</p>
                  </div>
                )}

                {businessProfile && (businessProfile.bankName || businessProfile.bankAccount || businessProfile.bankIfsc || businessProfile.bankUpi) && (
                  <div className="flex flex-col gap-1.5 bg-navy/5 border border-[#0C4737]/15 rounded-2xl p-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-green-dark">How to Pay / Bank Details</span>
                    <div className="text-[11px] text-navy font-semibold flex flex-col gap-1">
                      {businessProfile.bankName && <p><span className="text-text-secondary">Bank:</span> {businessProfile.bankName}</p>}
                      {businessProfile.bankAccount && <p><span className="text-text-secondary">Account Number:</span> {businessProfile.bankAccount}</p>}
                      {businessProfile.bankIfsc && <p><span className="text-text-secondary">IFSC:</span> {businessProfile.bankIfsc}</p>}
                      {businessProfile.bankUpi && <p><span className="text-text-secondary">UPI ID:</span> {businessProfile.bankUpi}</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Math details */}
              <div className="w-full md:w-80 flex flex-col gap-4 text-xs font-bold">
                <div className="flex justify-between items-center text-text-secondary">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-navy">{formatCurrency(invoice.subtotal)}</span>
                </div>

                <div className="flex justify-between items-center text-text-secondary">
                  <span>GST Total:</span>
                  <span className="font-semibold text-navy">{formatCurrency(invoice.gstAmount)}</span>
                </div>

                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-rose-600">
                    <span>Discount:</span>
                    <span className="font-semibold text-rose-600">-{formatCurrency(invoice.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-base font-extrabold border-t border-navy/10 pt-4 text-navy">
                  <span>Grand Total:</span>
                  <span className="text-lg font-black text-green">{formatCurrency(invoice.totalAmount)}</span>
                </div>

                {invoice.status === 'Paid' ? (
                  <div className="bg-green/10 border border-green/35 text-green-dark p-3.5 rounded-2xl flex items-center justify-between mt-2">
                    <span className="text-[11px] uppercase tracking-wider font-extrabold">Payment Received</span>
                    <span className="text-sm font-bold">₹0 Due</span>
                  </div>
                ) : (
                  <div className="bg-amber-500/10 border border-amber-500/35 text-amber-700 p-3.5 rounded-2xl flex items-center justify-between mt-2">
                    <span className="text-[11px] uppercase tracking-wider font-extrabold">Amount Due</span>
                    <span className="text-sm font-bold">{formatCurrency(invoice.totalAmount)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Printable Footer */}
            <div className="hidden print:flex justify-between items-center border-t border-navy/10 pt-8 mt-12 text-[10px] text-text-secondary font-semibold">
              <span>Generated via BillHouse Tax Invoicing System (INR)</span>
              <span>Page 1 of 1</span>
            </div>
          </GlassCard>
        </div>

        {/* Right Side: Sidebar Actions Panel (1/3 width, hidden when printing) */}
        <div className="lg:col-span-4 w-full flex flex-col gap-6 print:hidden sticky lg:top-24">
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

              {(invoice.status === 'Draft' || invoice.status === 'Sent') && (
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
