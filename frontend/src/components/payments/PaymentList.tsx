import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import Button from '../common/Button';
import GlassCard from '../common/GlassCard';
import RecordPaymentModal from './RecordPaymentModal';
import { useBusinessProfile } from '../../context/BusinessContext';
import { 
  Search, 
  Plus, 
  Trash2, 
  Printer, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Calendar,
  Filter
} from 'lucide-react';

interface PaymentData {
  _id: string;
  invoice: {
    _id: string;
    number: string;
    clientName: string;
    totalAmount: number;
    amountDue: number;
    status: string;
  } | null;
  tenantId: string;
  amount: number;
  date: string;
  method: 'UPI' | 'Bank Transfer' | 'Cash' | 'Card';
  transactionId?: string;
  notes?: string;
  createdAt: string;
}

export const PaymentList: React.FC = () => {
  const { businessProfile } = useBusinessProfile();
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Modal & alert states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [messageBox, setMessageBox] = useState<{ title: string; message: string; isOpen: boolean }>({
    title: '',
    message: '',
    isOpen: false
  });
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; paymentId: string; amount: number; invoiceNum: string } | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('All');
  const [clientFilter, setClientFilter] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchPaymentsData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      const [paymentsRes, invoicesRes, clientsRes] = await Promise.all([
        API.get('/payments'),
        API.get('/invoices'),
        API.get('/clients')
      ]);

      setPayments(paymentsRes.data);
      setInvoices(invoicesRes.data);
      setClients(clientsRes.data);
    } catch (err: any) {
      console.error('Failed to load payments history data:', err);
      setErrorMsg(err.response?.data?.error || 'Failed to retrieve payments history list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsData();
  }, []);

  const handleVoidPayment = (paymentId: string, amount: number, invoiceNum: string) => {
    setConfirmDialog({
      isOpen: true,
      paymentId,
      amount,
      invoiceNum
    });
  };

  const handleDownloadReceipt = (p: PaymentData) => {
    if (!p.invoice) return;
    
    // Create temporary container
    const element = document.createElement('div');
    element.style.padding = '20px';
    element.style.fontFamily = 'Inter, sans-serif';
    element.style.color = '#061B2D';
    element.innerHTML = `
      <div style="border: 2px solid #2F8F7A; border-radius: 16px; padding: 30px; background-color: #ffffff;">
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px;">
          <div>
            <h1 style="color: #0C4737; margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase;">Payment Receipt</h1>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #5F6B76;">Receipt for Invoice reference: <b>${p.invoice.number}</b></p>
          </div>
          <div style="text-align: right;">
            <h3 style="margin: 0; color: #061B2D; font-size: 14px;">${businessProfile?.name || 'BillHouse Partner'}</h3>
            <p style="margin: 3px 0 0 0; font-size: 10px; color: #5F6B76;">${businessProfile?.address || ''}</p>
          </div>
        </div>
        
        <div style="margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 12px;">
          <div>
            <p style="color: #5F6B76; margin: 0 0 5px 0; font-weight: bold; font-size: 10px; text-transform: uppercase;">Received From:</p>
            <p style="margin: 0; font-weight: bold; font-size: 13px;">${p.invoice.clientName}</p>
          </div>
          <div style="text-align: right;">
            <p style="color: #5F6B76; margin: 0 0 5px 0; font-weight: bold; font-size: 10px; text-transform: uppercase;">Receipt Details:</p>
            <p style="margin: 0;">Date: <b>${new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</b></p>
            <p style="margin: 3px 0 0 0;">Method: <b>${p.method}</b></p>
            ${p.transactionId ? '<p style="margin: 3px 0 0 0;">Ref ID: <span style="font-family: monospace;">' + p.transactionId + '</span></p>' : ''}
          </div>
        </div>
        
        <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
          <span style="font-size: 12px; color: #5F6B76;">Amount Received</span>
          <h2 style="font-size: 32px; font-weight: 900; margin: 5px 0 0 0; color: #0C4737;">₹${p.amount.toLocaleString('en-IN')}</h2>
        </div>
        
        ${p.notes ? '<div style="margin-top: 20px; padding: 15px; background-color: #F8FAFC; border-radius: 12px; border: 1px dashed #e2e8f0; font-size: 11px; color: #5F6B76; text-align: left;"><b>Notes:</b> ' + p.notes + '</div>' : ''}

        <div style="margin-top: 50px; border-top: 1px dashed #e2e8f0; padding-top: 15px; font-size: 9px; color: #5F6B76; text-align: center;">
          <p>This is a computer-generated payment receipt confirming transaction settlement. Thank you for your business!</p>
          <p style="margin: 5px 0 0 0; color: #061B2D; font-weight: bold;">Powered by BillHouse Invoicing SaaS.</p>
        </div>
      </div>
    `;

    const opt = {
      margin:       [15, 15, 15, 15],
      filename:     `Receipt-${p.invoice.number}-${p._id.slice(-6)}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'a5', orientation: 'landscape' }
    };

    const html2pdf = (window as any).html2pdf;
    if (html2pdf) {
      html2pdf().from(element).set(opt).save();
    } else {
      console.error('html2pdf.js library is not loaded');
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

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    // Search filter (searches transaction reference, notes, invoice number, or client name)
    const matchesSearch = searchQuery
      ? p.transactionId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.invoice?.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.invoice?.clientName.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    // Method filter
    const matchesMethod = methodFilter === 'All' ? true : p.method === methodFilter;

    // Client filter
    const matchesClient = clientFilter === 'All' ? true : p.invoice?.clientName === clientFilter;

    // Date range filter
    const matchesDate = (() => {
      if (!startDate && !endDate) return true;
      const paymentDate = new Date(p.date);
      paymentDate.setHours(0,0,0,0);
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0,0,0,0);
        if (paymentDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23,59,59,999);
        if (paymentDate > end) return false;
      }
      return true;
    })();

    return matchesSearch && matchesMethod && matchesClient && matchesDate;
  });

  // Calculate Metrics
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => {
    if (inv.status !== 'Cancelled') {
      return sum + (inv.amountDue || 0);
    }
    return sum;
  }, 0);

  return (
    <div className="flex flex-col gap-6 w-full max-w-full">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-navy/5 p-6 rounded-2xl shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-navy tracking-tight">Payments Workspace</h2>
          <p className="text-xs text-text-secondary font-semibold mt-0.5">
            View transaction logs, void payments, download receipts, and record client collections globally.
          </p>
        </div>
        <Button 
          onClick={() => setIsPaymentModalOpen(true)}
          variant="primary" 
          className="flex items-center gap-2 text-xs font-bold py-2.5 px-4 shadow-md hover:shadow-lg rounded-xl w-full sm:w-auto justify-center"
        >
          <Plus className="h-4.5 w-4.5" />
          Record Payment
        </Button>
      </div>

      {/* Stats Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Collected */}
        <GlassCard className="p-5 bg-gradient-to-br from-white to-green/5 border border-green/10 shadow-sm flex flex-col gap-2 hover:-translate-y-1 hover:border-green/20 hover:shadow-[0_8px_30px_rgba(16,185,129,0.08)] transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Revenue Collected</span>
            <div className="p-1.5 bg-green/10 rounded-lg">
              <CheckCircle2 className="h-3.5 w-3.5 text-green" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-green-dark">{formatCurrency(totalCollected)}</p>
          <p className="text-[11px] font-semibold text-text-secondary">Settled collections ledger</p>
        </GlassCard>

        {/* Total Outstanding Receivables */}
        <GlassCard className={`p-5 shadow-sm flex flex-col gap-2 hover:-translate-y-1 hover:shadow-md transition-all duration-300 ${totalOutstanding > 0 ? 'bg-gradient-to-br from-white to-amber-500/5 border border-amber-500/15 hover:border-amber-500/25 hover:shadow-[0_8px_30px_rgba(245,158,11,0.08)]' : 'bg-gradient-to-br from-white to-slate-50 border border-navy/5 hover:border-navy/15'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Pending Receivables</span>
            <div className={`p-1.5 rounded-lg ${totalOutstanding > 0 ? 'bg-amber-500/10' : 'bg-navy/5'}`}>
              <Clock className={`h-3.5 w-3.5 ${totalOutstanding > 0 ? 'text-amber-600' : 'text-navy/60'}`} />
            </div>
          </div>
          <p className={`text-2xl font-extrabold ${totalOutstanding > 0 ? 'text-amber-600' : 'text-navy'}`}>
            {formatCurrency(totalOutstanding)}
          </p>
          <p className="text-[11px] font-semibold text-text-secondary">Outstanding from client statements</p>
        </GlassCard>

        {/* Transaction Count */}
        <GlassCard className="p-5 bg-gradient-to-br from-white to-slate-50/80 border border-navy/5 shadow-sm flex flex-col gap-2 hover:-translate-y-1 hover:border-navy/15 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Transactions Logged</span>
            <div className="p-1.5 bg-navy/5 rounded-lg">
              <DollarSign className="h-3.5 w-3.5 text-navy/60" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-navy">{payments.length}</p>
          <p className="text-[11px] font-semibold text-text-secondary">Total recorded payment actions</p>
        </GlassCard>
      </div>

      {/* Advanced Control Filter Panel */}
      <div className="flex flex-col gap-4 bg-white border border-navy/5 p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          {/* Search bar */}
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search reference ref, client, or invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-navy/10 bg-white text-navy focus:outline-none focus:border-green focus:ring-1 focus:ring-green transition-all font-semibold"
            />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Payment Method filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary whitespace-nowrap">Method:</span>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-navy/10 bg-white text-navy focus:outline-none focus:border-green transition-all font-semibold cursor-pointer"
              >
                <option value="All">All Methods</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
              </select>
            </div>

            {/* Client filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary whitespace-nowrap">Client:</span>
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="px-3 py-2.5 text-xs rounded-xl border border-navy/10 bg-white text-navy focus:outline-none focus:border-green transition-all font-semibold cursor-pointer"
              >
                <option value="All">All Clients</option>
                {Array.from(new Set(payments.map(p => p.invoice?.clientName).filter(Boolean))).map((client) => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Date Ranges filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-navy/5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary font-bold">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="glass-input px-3 py-2 rounded-xl text-navy text-xs font-semibold shadow-sm focus:outline-none w-full bg-white"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary font-bold">End Date</label>
            <div className="relative flex items-center">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="glass-input px-3 py-2 rounded-xl text-navy text-xs font-semibold shadow-sm focus:outline-none w-full bg-white"
              />
              {(methodFilter !== 'All' || clientFilter !== 'All' || startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setMethodFilter('All');
                    setClientFilter('All');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="absolute right-3 text-xs font-bold text-red-500 hover:text-red-700"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-danger/10 border border-danger/35 text-danger text-xs font-bold rounded-2xl">
          {errorMsg}
        </div>
      )}

      {messageBox.isOpen && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-navy/5 shadow-2xl p-6 flex flex-col gap-5 text-center animate-scale-up">
            <div className="p-4 bg-green/10 text-green rounded-full mx-auto w-16 h-16 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-navy">{messageBox.title}</h3>
              <p className="text-xs text-text-secondary font-semibold mt-2 leading-relaxed whitespace-pre-wrap">
                {messageBox.message}
              </p>
            </div>
            <div className="flex justify-center pt-3">
              <Button
                variant="primary"
                onClick={() => setMessageBox(prev => ({ ...prev, isOpen: false }))}
                className="py-2.5 px-6 text-xs font-bold bg-green hover:bg-green-dark text-white rounded-xl shadow-sm"
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Table display */}
      <GlassCard className="overflow-hidden border-navy/5 shadow-sm">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green"></div>
            <p className="text-xs text-text-secondary font-bold">Loading transactions data...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center max-w-md mx-auto gap-4">
            <div className="h-16 w-16 bg-green/10 text-green rounded-full flex items-center justify-center text-2xl font-bold">
              💰
            </div>
            <div>
              <h3 className="text-base font-bold text-navy">No transactions logged</h3>
              <p className="text-xs text-text-secondary font-semibold mt-1.5 leading-relaxed">
                {searchQuery || methodFilter !== 'All' || clientFilter !== 'All' || startDate || endDate
                  ? "We couldn't find any transaction matches. Try adjusting your search query or filters."
                  : "No payment transaction history found. Record a client collection to populate this workspace."}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto w-full -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-navy/5 bg-[#F8FAFC]">
                  <th className="py-4 px-6 text-xs font-extrabold uppercase text-text-secondary tracking-wider">Date</th>
                  <th className="py-4 px-6 text-xs font-extrabold uppercase text-text-secondary tracking-wider">Transaction Ref ID</th>
                  <th className="py-4 px-6 text-xs font-extrabold uppercase text-text-secondary tracking-wider">Invoice #</th>
                  <th className="py-4 px-6 text-xs font-extrabold uppercase text-text-secondary tracking-wider">Client Name</th>
                  <th className="py-4 px-6 text-xs font-extrabold uppercase text-text-secondary tracking-wider">Method</th>
                  <th className="py-4 px-6 text-xs font-extrabold uppercase text-text-secondary tracking-wider text-right">Amount</th>
                  <th className="py-4 px-6 text-xs font-extrabold uppercase text-text-secondary tracking-wider text-center">Receipt</th>
                  <th className="py-4 px-6 text-xs font-extrabold uppercase text-text-secondary tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => (
                  <tr 
                    key={p._id}
                    className="border-b border-navy/5 hover:bg-navy/5 transition-colors"
                  >
                    <td className="py-4.5 px-6 text-xs font-semibold text-text-secondary">
                      {formatDate(p.date)}
                    </td>
                    <td className="py-4.5 px-6 font-mono text-[10px] text-navy font-bold">
                      {p.transactionId || '—'}
                    </td>
                    <td className="py-4.5 px-6 text-sm font-extrabold text-green-dark">
                      {p.invoice ? p.invoice.number : <span className="text-red-500 italic">Deleted Invoice</span>}
                    </td>
                    <td className="py-4.5 px-6 text-sm font-bold text-navy">
                      {p.invoice ? p.invoice.clientName : '—'}
                    </td>
                    <td className="py-4.5 px-6 text-xs font-semibold text-text-secondary">
                      {p.method}
                    </td>
                    <td className="py-4.5 px-6 text-sm font-black text-navy text-right">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-4.5 px-6 text-center">
                      {p.invoice ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadReceipt(p)}
                          className="px-3 py-1 bg-green/10 text-green hover:bg-green/20 rounded-lg text-xs font-extrabold transition-all"
                          title="Generate payment receipt A5 PDF"
                        >
                          Download
                        </button>
                      ) : (
                        <span className="text-[10px] text-text-secondary italic">N/A</span>
                      )}
                    </td>
                    <td className="py-4.5 px-6 text-center">
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleVoidPayment(p._id, p.amount, p.invoice?.number || 'Deleted')}
                        className="p-2 hover:bg-red-500/10 text-red-500 hover:text-red-700 rounded-lg transition-all"
                        title="Void payment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoice={null}
        onSuccess={(updatedInvoice, amountRecorded) => {
          fetchPaymentsData();
          setMessageBox({
            title: 'Payment Recorded',
            message: `A global payment of ₹${amountRecorded.toLocaleString('en-IN')} was successfully recorded for ${updatedInvoice.number}.`,
            isOpen: true
          });
        }}
      />

      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-[#06121E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-navy/5 shadow-2xl p-6 flex flex-col gap-5 text-center animate-scale-up">
            <div className="p-4 bg-red-500/10 text-red-500 rounded-full mx-auto w-16 h-16 flex items-center justify-center text-2xl">
              ⚠️
            </div>
            <div>
              <h3 className="text-base font-extrabold text-navy">Void Payment Transaction</h3>
              <p className="text-xs text-text-secondary font-semibold mt-2 leading-relaxed">
                Are you sure you want to void the payment of <strong>₹{confirmDialog.amount}</strong> applied to Invoice <strong>{confirmDialog.invoiceNum}</strong>?
                This will delete the payment log and restore the invoice's outstanding balance due.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-3">
              <Button
                variant="outline"
                onClick={() => setConfirmDialog(null)}
                className="py-2.5 px-4 text-xs font-bold border-navy/10 text-navy hover:bg-navy/5"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  const { paymentId } = confirmDialog;
                  setConfirmDialog(null);
                  try {
                    setActionLoading(true);
                    const res = await API.delete(`/payments/${paymentId}`);
                    setMessageBox({
                      title: 'Payment Voided',
                      message: res.data.message || 'Payment has been successfully voided and balances updated.',
                      isOpen: true
                    });
                    fetchPaymentsData();
                  } catch (err: any) {
                    alert(err.response?.data?.error || 'Failed to void payment record');
                  } finally {
                    setActionLoading(false);
                  }
                }}
                className="py-2.5 px-5 text-xs font-bold bg-red-500 hover:bg-red-600 border-red-500 text-white shadow-md"
              >
                Yes, Void Payment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentList;
