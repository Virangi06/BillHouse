import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import {
  ArrowLeft,
  Edit2,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  AlertTriangle,
  Plus,
  ChevronDown,
  User
} from 'lucide-react';
import GlassCard from '../common/GlassCard';
import Button from '../common/Button';
import { usePopup } from '../../context/PopupContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientData {
  _id: string;
  name: string;
  companyName?: string;
  email: string;
  phone?: string;
  address?: string;
  country?: string;
  taxId?: string;
  gstNumber?: string;
  notes?: string;
  createdAt: string;
}

interface ClientFinancials {
  totalBilled: number;
  totalPaid: number;
  totalOutstanding: number;
  invoiceCount: number;
  paidCount: number;
  overdueCount: number;
}

interface InvoiceItem {
  _id: string;
  number: string;
  date: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  status: 'Draft' | 'Sent' | 'Viewed' | 'Paid' | 'Overdue' | 'Cancelled';
}

interface ClientDetailProps {
  clientId: string;
  onBack: () => void;
  onEdit: (client: ClientData) => void;
  onNavigateToInvoice: (invoiceId: string) => void;
  onNavigateToInvoiceCreate?: (clientId: string) => void;
  onAddNotification: (type: 'payment' | 'invoice' | 'client' | 'system', title: string, message: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatINR = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  Draft:     { label: 'Draft',     bg: 'bg-gray-100',     text: 'text-gray-600',    dot: 'bg-gray-400' },
  Sent:      { label: 'Sent',      bg: 'bg-blue-50',      text: 'text-blue-700',    dot: 'bg-blue-400' },
  Viewed:    { label: 'Viewed',    bg: 'bg-purple-50',    text: 'text-purple-700',  dot: 'bg-purple-400' },
  Paid:      { label: 'Paid',      bg: 'bg-green/10',     text: 'text-green-dark',  dot: 'bg-green' },
  Overdue:   { label: 'Overdue',   bg: 'bg-danger/10',    text: 'text-danger',      dot: 'bg-danger' },
  Cancelled: { label: 'Cancelled', bg: 'bg-gray-100',     text: 'text-gray-500',    dot: 'bg-gray-300' },
};

const VALID_STATUSES = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];

// ─── Component ────────────────────────────────────────────────────────────────

const ClientDetail: React.FC<ClientDetailProps> = ({
  clientId,
  onBack,
  onEdit,
  onNavigateToInvoice,
  onNavigateToInvoiceCreate,
  onAddNotification
}) => {
  const [client, setClient] = useState<ClientData | null>(null);
  const [financials, setFinancials] = useState<ClientFinancials | null>(null);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeStatusId, setActiveStatusId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const { showPopup } = usePopup();

  // ─── Load client summary ───────────────────────────────────────────────────

  const loadSummary = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await API.get(`/clients/${clientId}/summary`);
      setClient(res.data.client);
      setFinancials(res.data.financials);
      setInvoices(res.data.invoices || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to load client details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) loadSummary();
  }, [clientId]);

  // ─── Invoice status update ─────────────────────────────────────────────────

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    setUpdatingStatusId(invoiceId);
    try {
      await API.patch(`/invoices/${invoiceId}/status`, { status: newStatus });
      setInvoices(prev => prev.map(inv => {
        if (inv._id !== invoiceId) return inv;
        const total = inv.totalAmount;
        const amountPaid = newStatus === 'Paid' ? total : 0;
        return { ...inv, status: newStatus as any, amountPaid, amountDue: total - amountPaid };
      }));
      // Refresh financials after status change
      await loadSummary();
      setActiveStatusId(null);
      onAddNotification('invoice', 'Invoice Status Updated', `Invoice status changed to ${newStatus}.`);
      showPopup({
        title: 'Success',
        message: `Invoice status changed to ${newStatus}.`,
        type: 'success'
      });
    } catch (err: any) {
      showPopup({
        title: 'Error',
        message: err.response?.data?.error || 'Failed to update invoice status.',
        type: 'error'
      });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // ─── Initials avatar ──────────────────────────────────────────────────────

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  // ─── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-white rounded-xl border border-navy/10 hover:bg-cream text-navy/70 hover:text-navy transition-all">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="h-5 w-40 bg-navy/8 animate-pulse rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-navy/5 animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-white rounded-2xl border border-navy/5 animate-pulse" />
      </div>
    );
  }

  // ─── Error state ───────────────────────────────────────────────────────────

  if (errorMsg || !client) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center py-20 text-center">
        <div className="p-4 bg-danger/10 rounded-full text-danger">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <p className="text-sm font-bold text-navy">{errorMsg || 'Client not found.'}</p>
        <Button variant="outline" onClick={onBack} className="text-xs font-bold">
          ← Back to Clients
        </Button>
      </div>
    );
  }

  const cfg = (s: string) => STATUS_CONFIG[s] || STATUS_CONFIG['Draft'];

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 w-full max-w-full">

      {/* Header row */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 bg-white rounded-xl border border-navy/10 hover:bg-cream text-navy/70 hover:text-navy transition-all shadow-sm"
          title="Back to Clients"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-navy tracking-tight">Client Profile</h2>
          <p className="text-xs text-text-secondary font-semibold">Full history & financial performance registry</p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
        {/* Left Column - Details & History (2/3 width) */}
        <div className="lg:col-span-8 flex flex-col gap-6 w-full">
          
          {/* Client Identity Card + Contact Info */}
          <GlassCard className="p-6 bg-white border-navy/5 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {/* Avatar */}
              <div className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-green/20 to-green-mint/30 flex items-center justify-center text-green-dark font-extrabold text-xl shadow-sm">
                {getInitials(client.name)}
              </div>

              {/* Identity block */}
              <div className="flex-1 flex flex-col gap-1.5">
                <div>
                  <h3 className="text-lg font-extrabold text-navy leading-tight">{client.name}</h3>
                  {client.companyName && (
                    <p className="text-sm font-semibold text-text-secondary flex items-center gap-1.5 mt-0.5">
                      <Building2 className="h-3.5 w-3.5" />
                      {client.companyName}
                    </p>
                  )}
                </div>

                {/* Contact grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-2">
                  <span className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-green" />
                    <span className="truncate">{client.email}</span>
                  </span>
                  {client.phone && (
                    <span className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-green" />
                      {client.phone}
                    </span>
                  )}
                  {client.address && (
                    <span className="flex items-center gap-2 text-xs font-semibold text-text-secondary sm:col-span-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-green" />
                      <span>{client.address}</span>
                    </span>
                  )}
                  {client.gstNumber && (
                    <span className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-green" />
                      GST: <span className="font-mono text-navy font-bold">{client.gstNumber}</span>
                    </span>
                  )}
                  {client.taxId && !client.gstNumber && (
                    <span className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-green" />
                      Tax ID: <span className="font-mono text-navy font-bold">{client.taxId}</span>
                    </span>
                  )}
                  {client.country && (
                    <span className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
                      <User className="h-3.5 w-3.5 shrink-0 text-green" />
                      {client.country}
                    </span>
                  )}
                </div>

                {client.notes && (
                  <div className="mt-4 px-4 py-3 bg-navy/5 rounded-2xl border border-navy/5">
                    <p className="text-[11px] font-semibold text-text-secondary leading-relaxed">
                      📝 <span className="text-navy font-bold">Notes:</span> {client.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Joined date */}
              <div className="shrink-0 text-right hidden sm:block">
                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Client since</p>
                <p className="text-sm font-extrabold text-navy mt-0.5">{formatDate(client.createdAt)}</p>
              </div>
            </div>
          </GlassCard>

          {/* Invoice History */}
          <GlassCard className="p-6 bg-white border-navy/5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-extrabold text-navy">Invoice History</h3>
                <p className="text-[11px] text-text-secondary font-semibold mt-0.5">
                  All invoices raised for {client.name}
                </p>
              </div>
            </div>

            {invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                <div className="p-4 bg-green/10 text-green rounded-full">
                  <FileText className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-bold text-navy">No invoices yet</p>
                  <p className="text-xs text-text-secondary font-semibold mt-1">
                    Create the first invoice for {client.name} to start tracking payments.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop table (≥ 640px) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-navy/5 text-text-secondary uppercase text-[10px] tracking-wider font-extrabold">
                        <th className="pb-3 pr-4">Invoice #</th>
                        <th className="pb-3 pr-4">Date</th>
                        <th className="pb-3 pr-4">Due Date</th>
                        <th className="pb-3 pr-4 text-right">Amount</th>
                        <th className="pb-3 pr-4 text-right">Paid</th>
                        <th className="pb-3 pr-4 text-right">Due</th>
                        <th className="pb-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy/5">
                      {invoices.map(inv => {
                        const s = cfg(inv.status);
                        const isChangingThis = activeStatusId === inv._id;
                        return (
                          <tr key={inv._id} className="hover:bg-navy/5 transition-colors">
                            <td className="py-3.5 pr-4">
                              <button
                                onClick={() => onNavigateToInvoice(inv._id)}
                                className="font-bold text-green hover:underline font-mono text-[11px]"
                              >
                                {inv.number}
                              </button>
                            </td>
                            <td className="py-3.5 pr-4 text-text-secondary font-semibold">{formatDate(inv.date)}</td>
                            <td className="py-3.5 pr-4 text-text-secondary font-semibold">{formatDate(inv.dueDate)}</td>
                            <td className="py-3.5 pr-4 text-right font-bold text-navy">{formatINR(inv.totalAmount)}</td>
                            <td className="py-3.5 pr-4 text-right font-semibold text-green-dark">{formatINR(inv.amountPaid)}</td>
                            <td className="py-3.5 pr-4 text-right font-semibold text-danger">{formatINR(inv.amountDue)}</td>
                            <td className="py-3.5 text-center relative">
                              <div className="relative inline-block">
                                <button
                                  onClick={() => setActiveStatusId(isChangingThis ? null : inv._id)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all hover:opacity-80 ${s.bg} ${s.text}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                  {inv.status}
                                  <ChevronDown className="h-3 w-3 opacity-60" />
                                </button>
                                {isChangingThis && (
                                  <div className="absolute right-0 top-8 z-30 w-36 bg-white border border-navy/8 shadow-xl rounded-2xl p-1.5 flex flex-col gap-0.5">
                                    {VALID_STATUSES.map(st => {
                                      const sc = cfg(st);
                                      return (
                                        <button
                                          key={st}
                                          disabled={updatingStatusId === inv._id}
                                          onClick={() => handleStatusChange(inv._id, st)}
                                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold transition-colors hover:bg-cream ${sc.text} ${inv.status === st ? 'bg-cream/80' : ''}`}
                                        >
                                          <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                                          {st}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards (< 640px) */}
                <div className="sm:hidden flex flex-col gap-3">
                  {invoices.map(inv => {
                    const s = cfg(inv.status);
                    const isChangingThis = activeStatusId === inv._id;
                    return (
                      <div key={inv._id} className="border border-navy/8 rounded-2xl p-4 bg-[#FAFCFB] flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <button
                              onClick={() => onNavigateToInvoice(inv._id)}
                              className="font-bold text-green hover:underline font-mono text-xs"
                            >
                              {inv.number}
                            </button>
                            <p className="text-[11px] text-text-secondary font-semibold mt-0.5">
                              {formatDate(inv.date)} → Due {formatDate(inv.dueDate)}
                            </p>
                          </div>
                          <div className="relative">
                            <button
                              onClick={() => setActiveStatusId(isChangingThis ? null : inv._id)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${s.bg} ${s.text}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                              {inv.status}
                              <ChevronDown className="h-3 w-3 opacity-60" />
                            </button>
                            {isChangingThis && (
                              <div className="absolute right-0 top-8 z-30 w-36 bg-white border border-navy/8 shadow-xl rounded-2xl p-1.5 flex flex-col gap-0.5">
                                {VALID_STATUSES.map(st => {
                                  const sc = cfg(st);
                                  return (
                                    <button
                                      key={st}
                                      disabled={updatingStatusId === inv._id}
                                      onClick={() => handleStatusChange(inv._id, st)}
                                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold transition-colors hover:bg-cream ${sc.text}`}
                                    >
                                      <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                                      {st}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-white rounded-xl p-2 border border-navy/5">
                            <p className="text-[9px] font-bold text-text-secondary uppercase tracking-wide">Total</p>
                            <p className="text-xs font-extrabold text-navy mt-0.5">{formatINR(inv.totalAmount)}</p>
                          </div>
                          <div className="bg-white rounded-xl p-2 border border-navy/5">
                            <p className="text-[9px] font-bold text-text-secondary uppercase tracking-wide">Paid</p>
                            <p className="text-xs font-extrabold text-green-dark mt-0.5">{formatINR(inv.amountPaid)}</p>
                          </div>
                          <div className="bg-white rounded-xl p-2 border border-navy/5">
                            <p className="text-[9px] font-bold text-text-secondary uppercase tracking-wide">Due</p>
                            <p className={`text-xs font-extrabold mt-0.5 ${inv.amountDue > 0 ? 'text-danger' : 'text-navy'}`}>{formatINR(inv.amountDue)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </GlassCard>
        </div>

        {/* Right Column - Financial Aggregates & Quick Actions (1/3 width) */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full sticky lg:top-24">
          
          {/* Quick Actions Panel */}
          <GlassCard className="p-6 border-navy/5 bg-white shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-extrabold text-navy border-b border-navy/5 pb-2">Client Actions</h3>
            <div className="flex flex-col gap-2.5 w-full">
              {onNavigateToInvoiceCreate && (
                <Button
                  variant="primary"
                  onClick={() => onNavigateToInvoiceCreate(client._id)}
                  className="w-full py-3 text-xs font-black shadow-md bg-green hover:bg-green-dark text-white rounded-xl flex items-center justify-center gap-2"
                >
                  <Plus className="h-4.5 w-4.5" />
                  Create Invoice
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => onEdit(client)}
                className="w-full py-2.5 text-xs font-bold border-navy/15 text-navy hover:bg-navy/5 rounded-xl flex items-center justify-center gap-1.5"
              >
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </GlassCard>

          {/* Financial Aggregates Widget */}
          {financials && (
            <GlassCard className="p-6 border-navy/5 bg-gradient-to-br from-white to-navy/5 shadow-sm flex flex-col gap-4">
              <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Financial Performance</h3>
              
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs font-semibold text-text-secondary">
                  <span>Total Billed:</span>
                  <span className="font-bold text-navy">{formatINR(financials.totalBilled)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-text-secondary">
                  <span>Total Paid:</span>
                  <span className="font-bold text-green-dark">{formatINR(financials.totalPaid)}</span>
                </div>
                
                <div className={`flex justify-between items-center text-base font-extrabold border-t border-navy/10 pt-4 ${financials.totalOutstanding > 0 ? 'text-amber-600' : 'text-navy'}`}>
                  <span>Outstanding:</span>
                  <span className="text-lg font-black">{formatINR(financials.totalOutstanding)}</span>
                </div>

                <div className="bg-navy/5 p-3 rounded-xl flex justify-between items-center text-[10px] text-text-secondary font-bold uppercase tracking-wider mt-1.5">
                  <span>Invoices Raised:</span>
                  <span className="text-navy text-xs font-extrabold">{financials.invoiceCount} statement{financials.invoiceCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </GlassCard>
          )}

        </div>
      </div>
    </div>
  );
};

export default ClientDetail;
