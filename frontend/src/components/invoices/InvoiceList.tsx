import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../../utils/api';
import Button from '../common/Button';
import GlassCard from '../common/GlassCard';
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
  MoreVertical
} from 'lucide-react';

export interface InvoiceData {
  _id: string;
  number: string;
  clientName: string;
  date: string;
  dueDate: string;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
}

export const InvoiceList: React.FC = () => {
  const [, setSearchParams] = useSearchParams();
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Filters and search
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<'date' | 'totalAmount' | 'dueDate'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Row action menu dropdown
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Fetch invoices from backend
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      const response = await API.get<InvoiceData[]>('/invoices', {
        params: {
          status: statusFilter,
          search: searchQuery || undefined
        }
      });
      
      setInvoices(response.data);
    } catch (err: any) {
      console.error('Failed to fetch invoices:', err);
      setErrorMsg(err.response?.data?.error || 'Failed to fetch invoices from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, searchQuery]);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenuId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }

    try {
      await API.delete(`/invoices/${id}`);
      setInvoices(prev => prev.filter(inv => inv._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete invoice');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await API.patch(`/invoices/${id}/status`, { status: newStatus });
      setInvoices(prev => prev.map(inv => inv._id === id ? { 
        ...inv, 
        status: newStatus as any,
        amountPaid: newStatus === 'Paid' ? inv.totalAmount : 0,
        amountDue: newStatus === 'Paid' ? 0 : inv.totalAmount
      } : inv));
      setActiveMenuId(null);
    } catch (err: any) {
      const msg = err.response?.data?.error 
        || (err.message === 'Network Error' ? 'Network error — please check backend is running and supports PATCH requests.' : null)
        || 'Failed to update status';
      alert(msg);
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

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
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
          className="flex items-center gap-2 text-xs font-bold py-2.5 px-4 shadow-md hover:shadow-lg rounded-xl"
        >
          <Plus className="h-4.5 w-4.5" />
          Create Invoice
        </Button>
      </div>

      {/* Control panel: search, sort, filters */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        {/* Status filtering tags */}
        <div className="flex flex-wrap gap-2">
          {['All', 'Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'].map((status) => (
            <button
              key={status}
              id={`filter-status-${status.toLowerCase()}`}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                statusFilter === status
                  ? 'bg-navy text-white shadow-sm'
                  : 'bg-white border border-navy/10 text-navy/70 hover:bg-navy/5'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

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
      </div>

      {errorMsg && (
        <div className="p-4 bg-danger/10 border border-danger/35 text-danger text-xs font-bold rounded-2xl">
          {errorMsg}
        </div>
      )}

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
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
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
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </div>
                  </th>
                  <th 
                    className="py-4 px-6 text-xs font-extrabold uppercase text-text-secondary tracking-wider cursor-pointer hover:text-navy transition-colors select-none"
                    onClick={() => handleSort('dueDate')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Due Date</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </div>
                  </th>
                  <th 
                    className="py-4 px-6 text-xs font-extrabold uppercase text-text-secondary tracking-wider cursor-pointer hover:text-navy transition-colors select-none text-right"
                    onClick={() => handleSort('totalAmount')}
                  >
                    <div className="flex items-center gap-1 justify-end">
                      <span>Amount</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
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
                    {/* Invoice Number */}
                    <td className="py-4.5 px-6">
                      <span className="text-sm font-extrabold text-navy hover:text-green transition-colors">
                        {inv.number}
                      </span>
                    </td>
                    
                    {/* Client Name */}
                    <td className="py-4.5 px-6">
                      <span className="text-sm font-bold text-navy">
                        {inv.clientName}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-4.5 px-6 text-xs font-semibold text-text-secondary">
                      {formatDate(inv.date)}
                    </td>

                    {/* Due Date */}
                    <td className="py-4.5 px-6 text-xs font-semibold text-text-secondary">
                      {formatDate(inv.dueDate)}
                    </td>

                    {/* Amount */}
                    <td className="py-4.5 px-6 text-sm font-extrabold text-navy text-right">
                      {formatCurrency(inv.totalAmount)}
                    </td>

                    {/* Status badge */}
                    <td className="py-4.5 px-6" onClick={(e) => e.stopPropagation()}>
                      {getStatusBadge(inv.status)}
                    </td>

                    {/* Actions cell */}
                    <td className="py-4.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigateToDetail(inv._id)}
                          title="View Details"
                          className="p-1.5 hover:bg-navy/5 rounded-lg text-text-secondary hover:text-navy transition-all"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </button>
                        
                        {inv.status === 'Draft' && (
                          <button
                            onClick={(e) => navigateToEdit(inv._id, e)}
                            title="Edit Invoice"
                            className="p-1.5 hover:bg-navy/5 rounded-lg text-text-secondary hover:text-navy transition-all"
                          >
                            <Edit2 className="h-4.5 w-4.5" />
                          </button>
                        )}

                        {inv.status !== 'Paid' ? (
                          <button
                            onClick={(e) => handleDelete(inv._id, e)}
                            title="Delete Invoice"
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-text-secondary hover:text-red-600 transition-all"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        ) : (
                          <div className="w-7"></div> // spacer
                        )}

                        {/* More options status changer */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === inv._id ? null : inv._id);
                            }}
                            className="p-1.5 hover:bg-navy/5 rounded-lg text-text-secondary hover:text-navy transition-all"
                          >
                            <MoreVertical className="h-4.5 w-4.5" />
                          </button>
                          
                          {activeMenuId === inv._id && (
                            <div className="absolute right-0 mt-2 z-10 w-40 bg-white border border-navy/5 rounded-xl shadow-lg p-1.5 flex flex-col gap-1 text-left">
                              <span className="text-[10px] font-extrabold text-text-secondary uppercase px-2.5 py-1">Set Status</span>
                              {['Draft', 'Sent', 'Paid', 'Cancelled'].map(st => (
                                <button
                                  key={st}
                                  onClick={(e) => handleStatusChange(inv._id, st, e)}
                                  className={`w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg text-left transition-colors ${
                                    inv.status === st 
                                      ? 'bg-navy/5 text-navy font-bold' 
                                      : 'text-text-secondary hover:bg-navy/5 hover:text-navy'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default InvoiceList;
