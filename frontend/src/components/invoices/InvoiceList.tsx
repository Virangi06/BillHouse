import { usePopup } from '../../context/PopupContext';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../../utils/api';
import Button from '../common/Button';
import GlassCard from '../common/GlassCard';
import RecordPaymentModal from '../payments/RecordPaymentModal';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit2, 
  Trash2, 
  ArrowUpDown, 
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Send,
  IndianRupee
} from 'lucide-react';

export interface InvoiceData {
  _id: string;
  number: string;
  clientName: string;
  date: string;
  dueDate: string;
  status: 'Draft' | 'Sent' | 'Viewed' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  remindersSent?: Array<{ type: '7d' | '14d' | '30d' | 'manual'; sentAt: string }>;
}

interface InvoiceListProps {
  onAddNotification?: (type: 'payment' | 'invoice' | 'client' | 'system', title: string, message: string) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ onAddNotification }) => {
  const [, setSearchParams] = useSearchParams();
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const { showPopup } = usePopup();
  const [paymentInvoice, setPaymentInvoice] = useState<any | null>(null);
  
  // Filters and search
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [clientFilter, setClientFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [clients, setClients] = useState<{ _id: string; name: string }[]>([]);

  const [sortField, setSortField] = useState<'date' | 'totalAmount' | 'dueDate'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Dropdown actions menu — track which row is open + its screen coords
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);
  
  // Fetch clients for dropdown options
  const fetchClients = async () => {
    try {
      const res = await API.get<{ _id: string; name: string }[]>('/clients');
      setClients(res.data);
    } catch (err) {
      console.error('Failed to load clients for filtering', err);
    }
  };

  // Fetch invoices from backend
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      const response = await API.get<InvoiceData[]>('/invoices', {
        params: {
          status: statusFilter,
          search: searchQuery || undefined,
          client: clientFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        }
      });
      
      setInvoices(response.data);
    } catch (err: any) {
      console.error('Failed to fetch invoices:', err);
      showPopup({
        title: 'Fetch Error',
        message: err.response?.data?.error || 'Failed to fetch invoices from server',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, searchQuery, clientFilter, startDate, endDate]);

  // Close dropdown on screen resize or scroll
  useEffect(() => {
    const closeDropdown = () => { setActiveDropdownId(null); setDropdownPos(null); };
    window.addEventListener('resize', closeDropdown);
    window.addEventListener('scroll', closeDropdown, true);
    return () => {
      window.removeEventListener('resize', closeDropdown);
      window.removeEventListener('scroll', closeDropdown, true);
    };
  }, []);

  const handleSort = (field: 'date' | 'totalAmount' | 'dueDate') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedInvoices = [...invoices].sort((a, b) => {
    let valA: any = a[sortField];
    let valB: any = b[sortField];

    if (sortField === 'date' || sortField === 'dueDate') {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    } else {
      valA = Number(valA);
      valB = Number(valB);
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleDelete = async (id: string) => {
    const targetInvoice = invoices.find(inv => inv._id === id);
    if (!targetInvoice) return;

    showPopup({
      title: 'Delete Invoice',
      message: `Are you sure you want to delete invoice ${targetInvoice.number}? This action cannot be undone.`,
      type: 'confirm',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await API.delete(`/invoices/${id}`);
          setInvoices(prev => prev.filter(inv => inv._id !== id));
          if (onAddNotification) {
            onAddNotification('invoice', 'Invoice Deleted', `Invoice ${targetInvoice.number} has been permanently deleted.`);
          }
          showPopup({
            title: 'Invoice Deleted',
            message: `Invoice ${targetInvoice.number} has been successfully deleted.`,
            type: 'success'
          });
        } catch (err: any) {
          showPopup({
            title: 'Delete Failed',
            message: err.response?.data?.error || 'Failed to delete invoice',
            type: 'error'
          });
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const handleSendEmail = async (id: string, number: string) => {
    try {
      setActionLoading(true);
      const res = await API.post(`/invoices/${id}/send`);
      showPopup({
        title: 'Invoice Dispatched',
        message: res.data.message || `Invoice ${number} sent to client successfully.`,
        type: 'success'
      });
      fetchInvoices();
      if (onAddNotification) {
        onAddNotification('invoice', 'Invoice Dispatched', `Invoice ${number} sent to client email.`);
      }
    } catch (err: any) {
      showPopup({
        title: 'Dispatch Failed',
        message: err.response?.data?.error || 'Failed to send invoice email.',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendReminder = async (id: string, number: string) => {
    try {
      setActionLoading(true);
      const res = await API.post(`/invoices/${id}/reminder`);
      showPopup({
        title: 'Reminder Dispatched',
        message: res.data.message || `Payment reminder for Invoice ${number} sent successfully.`,
        type: 'success'
      });
      fetchInvoices();
      if (onAddNotification) {
        onAddNotification('invoice', 'Reminder Dispatched', `Payment reminder for ${number} sent to client.`);
      }
    } catch (err: any) {
      showPopup({
        title: 'Reminder Failed',
        message: err.response?.data?.error || 'Failed to send payment reminder.',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const navigateToCreate = () => {
    setSearchParams({ tab: 'invoices', action: 'create' });
  };

  const navigateToDetail = (id: string) => {
    setSearchParams({ tab: 'invoices', action: 'detail', id });
  };

  const navigateToEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchParams({ tab: 'invoices', action: 'edit', id });
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

  const renderReminderBadges = (inv: InvoiceData) => {
    if (!inv.remindersSent || inv.remindersSent.length === 0) return null;
    const uniqueTypes = Array.from(new Set(inv.remindersSent.map(r => r.type)));
    return (
      <div className="flex flex-wrap gap-1 mt-1 max-w-[120px]">
        {uniqueTypes.map(type => {
          let label = '';
          let colorClass = '';
          if (type === '7d') {
            label = '7d';
            colorClass = 'bg-amber-500/10 text-amber-700 border-amber-500/20';
          } else if (type === '14d') {
            label = '14d';
            colorClass = 'bg-amber-600/10 text-amber-800 border-amber-600/20';
          } else if (type === '30d') {
            label = '30d';
            colorClass = 'bg-rose-500/10 text-rose-700 border-rose-500/20';
          } else if (type === 'manual') {
            label = 'Manual';
            colorClass = 'bg-blue-500/10 text-blue-700 border-blue-500/20';
          }
          return (
            <span key={type} className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider ${colorClass}`} title={`${label} reminder sent`}>
              {label}
            </span>
          );
        })}
      </div>
    );
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

  const totalBilled = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.amountDue || 0), 0);

  return (
    <div className="flex flex-col gap-6 w-full max-w-full">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-navy/5 p-6 rounded-2xl shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-navy tracking-tight">Invoice Registry</h2>
          <p className="text-xs text-text-secondary font-semibold mt-0.5">
            Create, track, and manage all your tenant invoices in INR (₹).
          </p>
        </div>
        <Button 
          id="btn-create-invoice"
          onClick={navigateToCreate}
          variant="primary" 
          className="flex items-center gap-2 text-xs font-bold py-2.5 px-4 shadow-md hover:shadow-lg rounded-xl w-full sm:w-auto justify-center"
        >
          <Plus className="h-4.5 w-4.5" />
          Create Invoice
        </Button>
      </div>

      {/* Stats Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Billed */}
        <GlassCard className="p-5 bg-gradient-to-br from-white to-slate-50/80 border border-navy/5 shadow-sm flex flex-col gap-2 hover:-translate-y-1 hover:border-navy/15 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Total Invoiced</span>
            <div className="p-1.5 bg-navy/5 rounded-lg">
              <FileText className="h-3.5 w-3.5 text-navy/60" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-navy">{formatCurrency(totalBilled)}</p>
          <p className="text-[11px] font-semibold text-text-secondary">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''} shown</p>
        </GlassCard>

        {/* Total Paid */}
        <GlassCard className="p-5 bg-gradient-to-br from-white to-green/5 border border-green/10 shadow-sm flex flex-col gap-2 hover:-translate-y-1 hover:border-green/20 hover:shadow-[0_8px_30px_rgba(16,185,129,0.08)] transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Payments Collected</span>
            <div className="p-1.5 bg-green/10 rounded-lg">
              <CheckCircle2 className="h-3.5 w-3.5 text-green" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-green-dark">{formatCurrency(totalPaid)}</p>
          <p className="text-[11px] font-semibold text-text-secondary">Received in INR</p>
        </GlassCard>

        {/* Total Outstanding */}
        <GlassCard className={`p-5 shadow-sm flex flex-col gap-2 hover:-translate-y-1 hover:shadow-md transition-all duration-300 ${totalOutstanding > 0 ? 'bg-gradient-to-br from-white to-amber-500/5 border border-amber-500/15 hover:border-amber-500/25 hover:shadow-[0_8px_30px_rgba(245,158,11,0.08)]' : 'bg-gradient-to-br from-white to-slate-50 border border-navy/5 hover:border-navy/15'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Outstanding Balance</span>
            <div className={`p-1.5 rounded-lg ${totalOutstanding > 0 ? 'bg-amber-500/10' : 'bg-navy/5'}`}>
              <Clock className={`h-3.5 w-3.5 ${totalOutstanding > 0 ? 'text-amber-600' : 'text-navy/60'}`} />
            </div>
          </div>
          <p className={`text-2xl font-extrabold ${totalOutstanding > 0 ? 'text-amber-600' : 'text-navy'}`}>
            {formatCurrency(totalOutstanding)}
          </p>
          <p className="text-[11px] font-semibold text-text-secondary">Receivables outstanding</p>
        </GlassCard>
      </div>

      {/* Control panel: search, sort, filters */}
      <div className="flex flex-col gap-4 bg-white border border-navy/5 p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          {/* Search bar */}
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <input
              id="invoice-search"
              type="text"
              placeholder="Search invoice number or client name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-navy/10 bg-white text-navy focus:outline-none focus:border-green focus:ring-1 focus:ring-green transition-all font-semibold"
            />
          </div>

          {/* Status filtering tags */}
          <div className="flex flex-wrap gap-1.5 justify-start lg:justify-end">
            {['All', 'Draft', 'Sent', 'Viewed', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'].map((status) => (
              <button
                key={status}
                id={`filter-status-${status.toLowerCase().replace(' ', '-')}`}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                  statusFilter === status
                    ? 'bg-navy border-navy text-white shadow-sm'
                    : 'bg-white border-navy/10 text-navy/70 hover:bg-navy/5'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary filters row (Client & Date Range) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-navy/5">
          {/* Client Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary select-none font-bold">Filter by Client</label>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="glass-input px-3 py-2 rounded-xl text-navy text-xs font-semibold shadow-sm focus:outline-none w-full cursor-pointer bg-white"
            >
              <option value="">All Clients</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary select-none font-bold">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="glass-input px-3 py-2 rounded-xl text-navy text-xs font-semibold shadow-sm focus:outline-none w-full bg-white"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary select-none font-bold">End Date</label>
            <div className="relative flex items-center">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="glass-input px-3 py-2 rounded-xl text-navy text-xs font-semibold shadow-sm focus:outline-none w-full bg-white"
              />
              {(clientFilter || startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setClientFilter('');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="absolute right-3 text-xs font-bold text-red-500 hover:text-red-700"
                  title="Clear advanced filters"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>



      {/* List Table container */}
      <GlassCard className="overflow-hidden border-navy/5 shadow-sm">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green"></div>
            <p className="text-xs text-text-secondary font-bold">Retrieving records from database...</p>
          </div>
        ) : sortedInvoices.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center max-w-md mx-auto gap-4">
            <div className="h-16 w-16 bg-green/10 text-green rounded-full flex items-center justify-center text-2xl font-bold">
              📄
            </div>
            <div>
              <h3 className="text-base font-bold text-navy">No invoices found</h3>
              <p className="text-xs text-text-secondary font-semibold mt-1.5 leading-relaxed">
                {searchQuery || statusFilter !== 'All' 
                  ? "We couldn't find any invoices matching your search criteria or status filter. Try clearing filters."
                  : "You haven't generated any invoices yet. Click 'Create Invoice' to compile your first client billing statement in INR."}
              </p>
            </div>
            {!searchQuery && statusFilter === 'All' && (
              <Button 
                onClick={navigateToCreate}
                variant="secondary"
                className="text-xs font-bold py-2.5 px-5 rounded-xl shadow-sm mt-2"
              >
                Create Invoice
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto w-full -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="border-b border-navy/5 bg-[#F8FAFC]">
                  <th className="py-4 px-6 text-xs font-extrabold uppercase text-text-secondary tracking-wider">Number</th>
                  <th className="py-4 px-6 text-xs font-extrabold uppercase text-text-secondary tracking-wider">Client</th>
                  <th 
                    className="py-4 px-6 text-xs font-extrabold uppercase text-text-secondary tracking-wider cursor-pointer hover:text-navy transition-colors select-none"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Issue Date</span>
                      {sortField === 'date' && (
                        <span className="text-[8px]">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                      )}
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                    </div>
                  </th>
                  <th 
                    className="py-4 px-6 text-xs font-extrabold uppercase text-text-secondary tracking-wider cursor-pointer hover:text-navy transition-colors select-none"
                    onClick={() => handleSort('dueDate')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Due Date</span>
                      {sortField === 'dueDate' && (
                        <span className="text-[8px]">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                      )}
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                    </div>
                  </th>
                  <th 
                    className="py-4 px-6 text-xs font-extrabold uppercase text-text-secondary tracking-wider cursor-pointer hover:text-navy transition-colors select-none text-right"
                    onClick={() => handleSort('totalAmount')}
                  >
                    <div className="flex items-center gap-1 justify-end">
                      <span>Amount</span>
                      {sortField === 'totalAmount' && (
                        <span className="text-[8px]">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                      )}
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                    </div>
                  </th>
                  <th className="py-4 px-6 text-xs font-extrabold uppercase text-text-secondary tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-extrabold uppercase text-text-secondary tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedInvoices.map((inv) => (
                  <tr 
                    key={inv._id}
                    onClick={() => navigateToDetail(inv._id)}
                    className="border-b border-navy/5 hover:bg-navy/5 cursor-pointer transition-colors"
                  >
                    <td className="py-4.5 px-6">
                      <span className="text-sm font-extrabold text-navy hover:text-green transition-colors">
                        {inv.number}
                      </span>
                    </td>
                    
                    <td className="py-4.5 px-6">
                      <span className="text-sm font-bold text-navy">
                        {inv.clientName}
                      </span>
                    </td>

                    <td className="py-4.5 px-6 text-xs font-semibold text-text-secondary">
                      {formatDate(inv.date)}
                    </td>

                    <td className="py-4.5 px-6 text-xs font-semibold text-text-secondary">
                      {formatDate(inv.dueDate)}
                    </td>

                    <td className="py-4.5 px-6 text-sm font-extrabold text-navy text-right">
                      {formatCurrency(inv.totalAmount)}
                    </td>

                    <td className="py-4.5 px-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col items-start gap-1">
                        {getStatusBadge(inv.status)}
                        {renderReminderBadges(inv)}
                      </div>
                    </td>

                    <td className="py-4.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end">
                        <button
                          disabled={actionLoading}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeDropdownId === inv._id) {
                              setActiveDropdownId(null);
                              setDropdownPos(null);
                            } else {
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              setDropdownPos({
                                top: rect.bottom + window.scrollY + 6,
                                right: window.innerWidth - rect.right
                              });
                              setActiveDropdownId(inv._id);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-navy/5 border border-navy/10 hover:bg-navy/10 rounded-xl text-xs font-bold text-navy transition-all disabled:opacity-50"
                        >
                          <span>{actionLoading && activeDropdownId === inv._id ? '...' : 'Actions'}</span>
                          <span className="text-[10px] opacity-60">▼</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* ---- Fixed-position Action Dropdown (portal, escapes table overflow) ---- */}
      {activeDropdownId && dropdownPos && (() => {
        const inv = invoices.find(i => i._id === activeDropdownId);
        if (!inv) return null;
        return (
          <>
            {/* Invisible backdrop to close on outside click */}
            <div
              className="fixed inset-0 z-[9998]"
              onClick={() => { setActiveDropdownId(null); setDropdownPos(null); }}
            />
            <div
              style={{ position: 'fixed', top: dropdownPos.top, right: dropdownPos.right, zIndex: 9999 }}
              className="w-48 bg-white border border-navy/10 rounded-xl shadow-2xl py-1.5 flex flex-col gap-0.5"
            >
              <button
                onClick={() => { setActiveDropdownId(null); setDropdownPos(null); navigateToDetail(inv._id); }}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-navy hover:bg-navy/5 transition-colors w-full text-left"
              >
                <Eye className="h-4 w-4 opacity-70" /> View Details
              </button>

              {inv.status === 'Draft' && (
                <button
                  onClick={(e) => { setActiveDropdownId(null); setDropdownPos(null); navigateToEdit(inv._id, e); }}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-navy hover:bg-navy/5 transition-colors w-full text-left"
                >
                  <Edit2 className="h-4 w-4 opacity-70" /> Edit Draft
                </button>
              )}

              {inv.status !== 'Cancelled' && (
                <button
                  onClick={() => { setActiveDropdownId(null); setDropdownPos(null); handleSendEmail(inv._id, inv.number); }}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-navy hover:bg-navy/5 transition-colors w-full text-left"
                >
                  <Send className="h-4 w-4 opacity-70" /> Send Email
                </button>
              )}

              {inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                <button
                  onClick={() => { setActiveDropdownId(null); setDropdownPos(null); setPaymentInvoice(inv); }}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-navy hover:bg-navy/5 transition-colors w-full text-left"
                >
                  <IndianRupee className="h-4 w-4 opacity-70" /> Record Payment
                </button>
              )}

              {['Sent', 'Viewed', 'Partially Paid', 'Overdue'].includes(inv.status) && (
                <button
                  onClick={() => { setActiveDropdownId(null); setDropdownPos(null); handleSendReminder(inv._id, inv.number); }}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-navy hover:bg-navy/5 transition-colors w-full text-left"
                >
                  <Clock className="h-4 w-4 opacity-70" /> Send Reminder
                </button>
              )}

              {inv.status !== 'Paid' && (
                <button
                  onClick={() => { setActiveDropdownId(null); setDropdownPos(null); handleDelete(inv._id); }}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-red-500 hover:bg-red-500/5 transition-colors w-full text-left"
                >
                  <Trash2 className="h-4 w-4 text-red-500 opacity-70" /> Delete Invoice
                </button>
              )}
            </div>
          </>
        );
      })()}

      <RecordPaymentModal
        isOpen={paymentInvoice !== null}
        onClose={() => setPaymentInvoice(null)}
        invoice={paymentInvoice}
        onSuccess={(updatedInvoice, amountRecorded) => {
          fetchInvoices();
          setMessageBox({
            title: 'Payment Recorded',
            message: `A payment of ₹${amountRecorded.toLocaleString('en-IN')} was recorded successfully for ${updatedInvoice.number}.`,
            isOpen: true
          });
          if (onAddNotification) {
            onAddNotification('payment', 'Payment Recorded', `Recorded ₹${amountRecorded} for ${updatedInvoice.number}.`);
          }
        }}
      />
    </div>
  );
};

export default InvoiceList;
