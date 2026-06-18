import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import Button from '../common/Button';
import { X, AlertCircle } from 'lucide-react';

interface InvoiceSummaryData {
  _id: string;
  number: string;
  amountDue: number;
  totalAmount: number;
  clientName: string;
}

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceSummaryData | null;
  onSuccess: (updatedInvoice: any, amountRecorded: number) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess
}) => {
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [method, setMethod] = useState<'UPI' | 'Bank Transfer' | 'Cash' | 'Card'>('UPI');
  const [transactionId, setTransactionId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (invoice) {
      setAmount(invoice.amountDue.toString());
      setDate(new Date().toISOString().split('T')[0]);
      setMethod('UPI');
      setTransactionId('');
      setNotes('');
      setErrorMsg(null);
    }
  }, [invoice, isOpen]);

  if (!isOpen || !invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Payment amount must be a number greater than 0');
      return;
    }

    if (parsedAmount > invoice.amountDue) {
      setErrorMsg(`Payment amount cannot exceed the remaining balance due (₹${invoice.amountDue})`);
      return;
    }

    try {
      setLoading(true);
      const res = await API.post('/payments', {
        invoiceId: invoice._id,
        amount: parsedAmount,
        date,
        method,
        transactionId,
        notes
      });
      onSuccess(res.data.invoice, parsedAmount);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to record payment transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#06121E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-navy/5 shadow-2xl p-6 flex flex-col gap-6 animate-float-fast max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-navy/5">
          <div>
            <h3 className="text-base font-extrabold text-navy">Record Payment</h3>
            <p className="text-[11px] text-text-secondary mt-0.5">
              Record a payment for invoice <span className="font-bold text-navy">{invoice.number}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-navy/5 hover:bg-navy/10 rounded-full text-text-secondary cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-danger/10 border border-danger/25 text-danger text-xs font-semibold rounded-xl flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs font-semibold">
          {/* Invoice Balance Stats strip */}
          <div className="grid grid-cols-2 gap-3 bg-[#F8FAFC] p-3 rounded-2xl border border-navy/5">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-text-secondary uppercase tracking-wider">Total Value</span>
              <span className="text-sm font-extrabold text-navy">₹{invoice.totalAmount}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-text-secondary uppercase tracking-wider">Balance Due</span>
              <span className="text-sm font-black text-amber-600">₹{invoice.amountDue}</span>
            </div>
          </div>

          {/* Amount field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-secondary">Amount Received (₹) *</label>
            <input
              type="number"
              required
              step="any"
              min="0.01"
              max={invoice.amountDue}
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-navy/10 bg-[#F8FAFC] text-navy focus:outline-none focus:border-green focus:bg-white transition-all font-semibold"
            />
          </div>

          {/* Date & Method Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-text-secondary">Payment Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-navy/10 bg-[#F8FAFC] text-navy focus:outline-none focus:border-green focus:bg-white transition-all font-semibold"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-text-secondary">Method *</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-navy/10 bg-[#F8FAFC] text-navy focus:outline-none focus:border-green focus:bg-white transition-all font-semibold cursor-pointer"
              >
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
              </select>
            </div>
          </div>

          {/* Transaction ID */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-secondary">Transaction ID / Reference (Optional)</label>
            <input
              type="text"
              placeholder="e.g. UPI Ref Number, Bank Txn ID"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-navy/10 bg-[#F8FAFC] text-navy focus:outline-none focus:border-green focus:bg-white transition-all font-semibold font-mono"
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-secondary">Internal Memo / Notes (Optional)</label>
            <textarea
              placeholder="e.g. Partial check clearing, paid via phone"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-navy/10 bg-[#F8FAFC] text-navy focus:outline-none focus:border-green focus:bg-white transition-all font-semibold resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-navy/5 mt-1">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={onClose}
              className="py-2.5 px-4 text-xs font-bold border-navy/10 text-navy hover:bg-navy/5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              className="py-2.5 px-5 text-xs font-bold bg-green hover:bg-green-dark text-white rounded-xl shadow-md"
            >
              Record Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordPaymentModal;
