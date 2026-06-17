import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../../utils/api';
import Button from '../common/Button';
import GlassCard from '../common/GlassCard';
import Input from '../common/Input';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  UserPlus, 
  Save,
  Send,
  Search,
  AlertCircle
} from 'lucide-react';

interface Client {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  taxId?: string;
  address?: string;
}

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  gstRate: number; // e.g. 0, 5, 12, 18, 28
  amount: number; // quantity * rate
}

interface InvoiceFormProps {
  onAddNotification?: (type: 'payment' | 'invoice' | 'client' | 'system', title: string, message: string) => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ onAddNotification }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const invoiceId = searchParams.get('id');
  const action = searchParams.get('action'); // 'create' or 'edit'


  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState<string>('');
  const [loadingClients, setLoadingClients] = useState<boolean>(false);
  const [savingInvoice, setSavingInvoice] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick Client Creation Modal State
  const [isClientModalOpen, setIsClientModalOpen] = useState<boolean>(false);
  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    phone: '',
    taxId: '',
    address: ''
  });
  const [savingClient, setSavingClient] = useState<boolean>(false);
  const [clientError, setClientError] = useState<string | null>(null);

  // Form State
  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    return searchParams.get('clientId') || '';
  });
  const [invoiceNumber, setInvoiceNumber] = useState<string>('INV-XXXXXX');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [items, setItems] = useState<LineItem[]>([
    { description: '', quantity: 1, rate: 0, gstRate: 18, amount: 0 }
  ]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [terms, setTerms] = useState<string>('');

  // Fetch all clients
  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const res = await API.get<Client[]>('/clients');
      setClients(res.data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to load client directory');
    } finally {
      setLoadingClients(false);
    }
  };

  // If in edit mode, load the invoice
  const fetchInvoiceForEdit = async (id: string) => {
    try {
      const res = await API.get<any>(`/invoices/${id}`);
      const inv = res.data;
      
      setSelectedClientId(inv.client);
      setInvoiceNumber(inv.number);
      if (inv.date) setDate(new Date(inv.date).toISOString().split('T')[0]);
      if (inv.dueDate) setDueDate(new Date(inv.dueDate).toISOString().split('T')[0]);
      
      const mappedItems = inv.items.map((it: any) => ({
        description: it.description,
        quantity: it.quantity,
        rate: it.rate,
        gstRate: it.gstRate,
        amount: it.amount
      }));
      setItems(mappedItems);
      
      setDiscountAmount(inv.discountAmount || 0);
      setNotes(inv.notes || '');
      setTerms(inv.terms || '');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to fetch invoice details for editing');
    }
  };

  useEffect(() => {
    fetchClients();
    if (action === 'edit' && invoiceId) {
      fetchInvoiceForEdit(invoiceId);
    } else if (action === 'create') {
      const cid = searchParams.get('clientId');
      if (cid) {
        setSelectedClientId(cid);
      }
    }
  }, [action, invoiceId]);

  // Recalculate individual item amounts when quantity or rate changes
  const handleItemChange = (index: number, field: keyof LineItem, value: any) => {
    const updatedItems = [...items];
    const item = { ...updatedItems[index] };

    if (field === 'quantity') {
      item.quantity = Math.max(1, parseFloat(value) || 1);
      item.amount = item.quantity * item.rate;
    } else if (field === 'rate') {
      item.rate = Math.max(0, parseFloat(value) || 0);
      item.amount = item.quantity * item.rate;
    } else if (field === 'gstRate') {
      item.gstRate = parseFloat(value) || 0;
    } else if (field === 'description') {
      item.description = value;
    }

    updatedItems[index] = item;
    setItems(updatedItems);
  };

  const addLineItem = () => {
    setItems([...items, { description: '', quantity: 1, rate: 0, gstRate: 18, amount: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Math totals calculation
  const subtotal = items.reduce((acc, curr) => acc + curr.amount, 0);
  const gstTotal = items.reduce((acc, curr) => acc + (curr.amount * (curr.gstRate / 100)), 0);
  const totalAmount = subtotal + gstTotal - discountAmount;

  // Filter clients
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const selectedClient = clients.find(c => c._id === selectedClientId);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name || !clientForm.email) {
      setClientError('Name and email are required');
      return;
    }

    try {
      setSavingClient(true);
      setClientError(null);
      const res = await API.post('/clients', clientForm);
      const newClient = res.data.client;
      
      setClients(prev => [newClient, ...prev]);
      setSelectedClientId(newClient._id);
      setIsClientModalOpen(false);
      if (onAddNotification) {
        onAddNotification('client', 'New Client Registered', `${clientForm.name} was registered via Invoice Form.`);
      }
      setClientForm({ name: '', email: '', phone: '', taxId: '', address: '' });
    } catch (err: any) {
      setClientError(err.response?.data?.error || 'Failed to create client');
    } finally {
      setSavingClient(false);
    }
  };

  const handleSubmitInvoice = async (status: 'Draft' | 'Sent') => {
    if (!selectedClientId) {
      setErrorMsg('Please select a client first');
      return;
    }

    if (items.some(item => !item.description.trim())) {
      setErrorMsg('All line items must have a description');
      return;
    }

    try {
      setSavingInvoice(true);
      setErrorMsg(null);

      const payload = {
        clientId: selectedClientId,
        date,
        dueDate,
        discountAmount,
        notes,
        terms,
        items,
        status
      };

      let response;
      if (action === 'edit' && invoiceId) {
        response = await API.put(`/invoices/${invoiceId}`, payload);
        if (onAddNotification) {
          onAddNotification('invoice', 'Invoice Updated', `Invoice ${response.data.invoice.number} details were updated successfully.`);
        }
      } else {
        response = await API.post('/invoices', payload);
        if (onAddNotification) {
          onAddNotification('invoice', 'New Invoice Issued', `Invoice ${response.data.invoice.number} was compiled successfully for ₹${response.data.invoice.totalAmount}.`);
        }
      }

      // Redirect back to list
      setSearchParams({ tab: 'invoices' });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Failed to save invoice');
    } finally {
      setSavingInvoice(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-full">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSearchParams({ tab: 'invoices' })}
            className="p-2 bg-white border border-navy/10 rounded-xl text-navy hover:bg-navy/5 transition-all shadow-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-navy tracking-tight">
              {action === 'edit' ? `Edit Invoice (${invoiceNumber})` : 'Compile New Invoice'}
            </h2>
            <p className="text-xs text-text-secondary font-semibold mt-0.5">
              Draft or issue a tax compliant billing statement.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-danger/10 border border-danger/35 text-danger text-xs font-bold rounded-2xl animate-float-fast flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
        {/* Left Column - Form editor (2/3 width) */}
        <div className="lg:col-span-8 flex flex-col gap-6 w-full">
          {/* Client Selector */}
          <GlassCard className="p-6 border-navy/5 bg-white shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-navy">Client Billing Details</h3>
              <Button
                id="btn-quick-add-client"
                variant="outline"
                type="button"
                onClick={() => setIsClientModalOpen(true)}
                className="flex items-center gap-1.5 text-[11px] font-bold py-1.5 px-3 border-green/30 text-green hover:bg-green/5 hover:border-green/50"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Quick Add Client
              </Button>
            </div>
            
            <div className="flex gap-2 items-center">
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="glass-input px-4 py-2.5 rounded-xl text-navy text-xs font-semibold shadow-sm focus:outline-none w-full cursor-pointer bg-white"
              >
                <option value="">-- Choose Client --</option>
                {clients.map(c => (
                  <option key={c._id} value={c._id}>{c.name} ({c.email})</option>
                ))}
              </select>
            </div>

            {selectedClient && (
              <div className="p-4 bg-navy/5 border border-navy/10 rounded-2xl text-xs flex flex-col gap-1.5 font-semibold text-text-secondary">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                  <span className="text-navy font-extrabold text-sm">{selectedClient.name}</span>
                  <span className="text-[11px]">✉ {selectedClient.email}</span>
                </div>
                {selectedClient.address && <p className="leading-relaxed">📍 {selectedClient.address}</p>}
                {selectedClient.phone && <p>📞 {selectedClient.phone}</p>}
                {selectedClient.taxId && <p className="font-bold text-navy">GSTIN: {selectedClient.taxId}</p>}
              </div>
            )}
          </GlassCard>

          {/* Invoice Settings Metadata */}
          <GlassCard className="p-6 border-navy/5 bg-white shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-extrabold text-navy">Invoice Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary select-none">Invoice Number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  disabled
                  className="glass-input px-3.5 py-2.5 rounded-xl text-navy/50 bg-navy/5 cursor-not-allowed text-xs shadow-sm focus:outline-none w-full font-bold"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary select-none">Issue Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="glass-input px-3.5 py-2.5 rounded-xl text-navy text-xs font-semibold shadow-sm focus:outline-none w-full bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary select-none">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="glass-input px-3.5 py-2.5 rounded-xl text-navy text-xs font-semibold shadow-sm focus:outline-none w-full bg-white"
                />
              </div>
            </div>
          </GlassCard>

          {/* Line Items Spreadsheet Grid */}
          <GlassCard className="p-6 border-navy/5 bg-white shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-navy">Line Items Directory</h3>
              <Button
                type="button"
                variant="outline"
                onClick={addLineItem}
                className="flex items-center gap-1.5 text-[11px] font-bold py-1.5 px-3 border-green/30 text-green hover:bg-green/5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Item
              </Button>
            </div>

            {/* Desktop Spreadsheet Table */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-navy/10 bg-navy/5 text-text-secondary uppercase text-[10px] tracking-wider font-extrabold">
                    <th className="py-2.5 px-3 w-5/12">Description</th>
                    <th className="py-2.5 px-3 text-right w-1/12">Qty</th>
                    <th className="py-2.5 px-3 text-right w-2/12">Rate (₹)</th>
                    <th className="py-2.5 px-3 text-right w-2/12">GST %</th>
                    <th className="py-2.5 px-3 text-right w-2/12">Amount</th>
                    <th className="py-2.5 px-3 text-center w-1/12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-cream/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          required
                          placeholder="Service or product description..."
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="w-full bg-white border border-navy/10 rounded-xl px-3 py-2 text-xs text-navy focus:outline-none focus:border-green font-semibold"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          required
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full bg-white border border-navy/10 rounded-xl px-2 py-2 text-xs text-navy focus:outline-none focus:border-green font-semibold text-right"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                          className="w-full bg-white border border-navy/10 rounded-xl px-2 py-2 text-xs text-navy focus:outline-none focus:border-green font-semibold text-right"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          value={item.gstRate}
                          onChange={(e) => handleItemChange(idx, 'gstRate', e.target.value)}
                          className="w-full bg-white border border-navy/10 rounded-xl px-2 py-2 text-xs text-navy focus:outline-none focus:border-green font-semibold cursor-pointer"
                        >
                          <option value={0}>0%</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                          <option value={28}>28%</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-navy select-none">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLineItem(idx)}
                            className="p-1.5 hover:bg-rose-500/10 text-text-secondary hover:text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* Right Column - Billing Calculations & Actions (1/3 width) */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full sticky lg:top-24">
          {/* Action buttons panel */}
          <GlassCard className="p-6 border-navy/5 bg-white shadow-sm flex flex-col gap-3">
            <h3 className="text-sm font-extrabold text-navy border-b border-navy/5 pb-2">Actions</h3>
            <div className="flex flex-col gap-2.5 w-full">
              <Button
                variant="primary"
                type="button"
                isLoading={savingInvoice}
                onClick={() => handleSubmitInvoice('Sent')}
                className="w-full py-3 text-xs font-black shadow-md bg-green hover:bg-green-dark text-white rounded-xl"
              >
                Save & Issue Sent
              </Button>
              <Button
                variant="outline"
                type="button"
                isLoading={savingInvoice}
                onClick={() => handleSubmitInvoice('Draft')}
                className="w-full py-3 text-xs font-bold border-navy/20 hover:bg-navy/5 hover:border-navy/35 rounded-xl"
              >
                Save Draft
              </Button>
              <button
                type="button"
                onClick={() => setSearchParams({ tab: 'invoices' })}
                className="text-center text-xs font-bold text-navy/60 hover:text-navy hover:underline py-1 mt-1 transition-all"
              >
                Cancel & Return
              </button>
            </div>
          </GlassCard>

          {/* Math Summary Widget */}
          <GlassCard className="p-6 border-navy/5 bg-gradient-to-br from-white to-navy/5 shadow-sm flex flex-col gap-4">
            <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Summary</h3>
            
            <div className="flex flex-col gap-3 border-b border-navy/10 pb-4">
              <div className="flex justify-between items-center text-xs font-semibold text-text-secondary">
                <span>Subtotal:</span>
                <span className="font-bold text-navy">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold text-text-secondary">
                <span>GST Tax (₹):</span>
                <span className="font-bold text-navy">{formatCurrency(gstTotal)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <Input
                label="Discount Value (₹)"
                type="number"
                min="0"
                max={subtotal + gstTotal}
                step="1"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
              />
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-navy/10 mt-1">
              <span className="text-xs font-extrabold text-navy">Grand Total:</span>
              <span className="text-lg font-black text-green">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </GlassCard>

          {/* Notes & Terms panel */}
          <GlassCard className="p-6 border-navy/5 bg-white shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-extrabold text-navy border-b border-navy/5 pb-2">Remarks</h3>
            
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary select-none">Notes / Payment Codes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Client bank details, transfer code, reference..."
                rows={2}
                className="glass-input px-3.5 py-2.5 rounded-xl text-navy text-xs font-semibold shadow-sm focus:outline-none w-full resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary select-none">Terms & Conditions</label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Due within 30 days. Late fee applies..."
                rows={2}
                className="glass-input px-3.5 py-2.5 rounded-xl text-navy text-xs font-semibold shadow-sm focus:outline-none w-full resize-none"
              />
            </div>
          </GlassCard>
        </div>
      </div>

      {/* QUICK CLIENT MODAL */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <GlassCard className="max-w-md w-full p-6 border-navy/5 shadow-2xl bg-white flex flex-col gap-6 animate-scale-up">
            <div className="flex justify-between items-start border-b border-navy/10 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-navy">Quick Register Client</h3>
                <p className="text-xs text-text-secondary font-semibold mt-1">Add a client directly into active registry.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsClientModalOpen(false)}
                className="p-1 hover:bg-navy/5 rounded-lg text-text-secondary hover:text-navy transition-all"
              >
                ✕
              </button>
            </div>

            {clientError && (
              <div className="p-3 bg-danger/10 border border-danger/35 text-danger text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{clientError}</span>
              </div>
            )}

            <form onSubmit={handleCreateClient} className="flex flex-col gap-4">
              <Input
                label="Full Name / Company Entity"
                placeholder="E.g. Acme Corp Inc."
                value={clientForm.name}
                onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="E.g. accounting@acme.com"
                value={clientForm.email}
                onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                required
              />

              <Input
                label="Contact Number"
                placeholder="E.g. +91 98765 43210"
                value={clientForm.phone}
                onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
              />

              <Input
                label="GSTIN Number / Tax Identification"
                placeholder="E.g. 27AADCA1234F1Z5"
                value={clientForm.taxId}
                onChange={(e) => setClientForm({ ...clientForm, taxId: e.target.value })}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Billing Address</label>
                <textarea
                  value={clientForm.address}
                  onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                  placeholder="Street, City, State, ZIP code..."
                  rows={2}
                  className="glass-input px-4 py-3 rounded-xl text-navy text-base shadow-sm focus:outline-none w-full"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-navy/10">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="py-2.5 px-4 text-xs font-bold border-navy/10 text-navy hover:bg-navy/5"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={savingClient}
                  className="py-2.5 px-5 text-xs font-bold"
                >
                  Save & Select Client
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default InvoiceForm;
