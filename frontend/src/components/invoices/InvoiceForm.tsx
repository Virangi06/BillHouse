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

export const InvoiceForm: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const invoiceId = searchParams.get('id');
  const action = searchParams.get('action'); // 'create' or 'edit'

  const [step, setStep] = useState<number>(1);
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
  const [selectedClientId, setSelectedClientId] = useState<string>('');
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
      setClientForm({ name: '', email: '', phone: '', taxId: '', address: '' });
      // Proceed automatically to Step 2
      setStep(2);
    } catch (err: any) {
      setClientError(err.response?.data?.error || 'Failed to create client');
    } finally {
      setSavingClient(false);
    }
  };

  const handleSubmitInvoice = async (status: 'Draft' | 'Sent') => {
    if (!selectedClientId) {
      setErrorMsg('Please select a client first');
      setStep(1);
      return;
    }

    if (items.some(item => !item.description.trim())) {
      setErrorMsg('All line items must have a description');
      setStep(3);
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

      if (action === 'edit' && invoiceId) {
        await API.put(`/invoices/${invoiceId}`, payload);
      } else {
        await API.post('/invoices', payload);
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

  const nextStep = () => {
    if (step === 1 && !selectedClientId) {
      setErrorMsg('Please select a client to proceed');
      return;
    }
    setErrorMsg(null);
    setStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setErrorMsg(null);
    setStep(prev => Math.max(prev - 1, 1));
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const renderStepHeader = () => {
    const stepNames = ['Select Client', 'Invoice Details', 'Line Items', 'Review Summary', 'Finalize'];
    return (
      <div className="flex justify-between items-center bg-white border border-navy/5 p-4.5 rounded-2xl shadow-sm mb-6 overflow-x-auto w-full">
        {stepNames.map((name, i) => {
          const stepNum = i + 1;
          const isActive = step === stepNum;
          const isCompleted = step > stepNum;
          return (
            <div key={name} className="flex items-center gap-2 shrink-0">
              <span className={`h-6.5 w-6.5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                isActive 
                  ? 'bg-green text-white shadow' 
                  : isCompleted 
                    ? 'bg-navy text-white' 
                    : 'bg-navy/5 text-navy/40 border border-navy/10'
              }`}>
                {isCompleted ? '✓' : stepNum}
              </span>
              <span className={`text-xs font-bold ${isActive ? 'text-green' : isCompleted ? 'text-navy' : 'text-navy/40'}`}>
                {name}
              </span>
              {i < stepNames.length - 1 && (
                <span className="text-navy/10 font-bold px-2">→</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSearchParams({ tab: 'invoices' })}
            className="p-2 bg-white border border-navy/10 rounded-xl text-navy hover:bg-navy/5 transition-all"
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

      {renderStepHeader()}

      {errorMsg && (
        <div className="p-4 bg-danger/10 border border-danger/35 text-danger text-xs font-bold rounded-2xl animate-float-fast flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: CLIENT SELECTION */}
      {step === 1 && (
        <GlassCard className="p-6 border-navy/5 shadow-sm flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-extrabold text-navy">Choose Billing Client</h3>
              <p className="text-xs text-text-secondary font-semibold mt-1">
                Select from client registry or create a new profiles database entry.
              </p>
            </div>
            <Button
              id="btn-quick-add-client"
              variant="outline"
              onClick={() => setIsClientModalOpen(true)}
              className="flex items-center gap-2 text-xs font-bold py-2 px-3 border-green/30 text-green hover:bg-green/5 hover:border-green/50"
            >
              <UserPlus className="h-4 w-4" />
              Quick Add Client
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by client name, business entity or email..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-navy/10 bg-white text-navy focus:outline-none focus:border-green focus:ring-1 focus:ring-green transition-all font-semibold"
            />
          </div>

          {loadingClients ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-green"></div>
              <p className="text-xs text-text-secondary font-bold">Retrieving clients...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="py-12 border-2 border-dashed border-navy/10 rounded-2xl text-center flex flex-col items-center gap-3">
              <span className="text-xl">👥</span>
              <div>
                <h4 className="text-xs font-bold text-navy">No client entries match</h4>
                <p className="text-[11px] text-text-secondary font-medium mt-1">Try refining search parameters or click "Quick Add Client".</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 max-h-96 overflow-y-auto pr-1">
              {filteredClients.map((client) => {
                const isSelected = selectedClientId === client._id;
                return (
                  <div
                    key={client._id}
                    onClick={() => {
                      setSelectedClientId(client._id);
                      setErrorMsg(null);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 relative ${
                      isSelected 
                        ? 'border-green bg-green/5 shadow-inner' 
                        : 'border-navy/15 bg-white hover:bg-navy/5 hover:border-navy/25'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-3 right-3 text-green text-sm font-bold">✓ Selected</span>
                    )}
                    <h4 className="text-sm font-extrabold text-navy">{client.name}</h4>
                    <div className="flex flex-col gap-1 text-xs text-text-secondary font-semibold">
                      <span>✉ {client.email}</span>
                      {client.phone && <span>📞 {client.phone}</span>}
                      {client.taxId && <span>💼 GSTIN: {client.taxId}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      )}

      {/* STEP 2: METADATA */}
      {step === 2 && (
        <GlassCard className="p-6 border-navy/5 shadow-sm flex flex-col gap-6">
          <div>
            <h3 className="text-base font-extrabold text-navy">Invoice Settings</h3>
            <p className="text-xs text-text-secondary font-semibold mt-1">
              Set billing issue dates, payment terms due structures, and index prefixes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Invoice Number
              </label>
              <input
                type="text"
                value={invoiceNumber}
                disabled
                className="glass-input px-4 py-3 rounded-xl text-navy/50 bg-navy/5 cursor-not-allowed text-base shadow-sm focus:outline-none w-full font-bold"
              />
              <span className="text-[10px] text-text-secondary font-bold">
                * Sequentially isolated auto-generated tag (`INV-XXXXXX`) calculated on submit.
              </span>
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Billing Currency
              </label>
              <input
                type="text"
                value="INR (₹) Rupees"
                disabled
                className="glass-input px-4 py-3 rounded-xl text-navy/50 bg-navy/5 cursor-not-allowed text-base shadow-sm focus:outline-none w-full font-semibold"
              />
            </div>

            <Input
              label="Issue Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <Input
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
        </GlassCard>
      )}

      {/* STEP 3: LINE ITEMS GRID */}
      {step === 3 && (
        <GlassCard className="p-6 border-navy/5 shadow-sm flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-extrabold text-navy">Line Items Directory</h3>
              <p className="text-xs text-text-secondary font-semibold mt-1">
                Enter service descriptions, quantities, unit prices, and GST rates.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={addLineItem}
              className="flex items-center gap-1.5 text-xs font-bold py-2 px-3 border-green/30 text-green hover:bg-green/5"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            {items.map((item, idx) => (
              <div key={idx} className="p-4 bg-navy/5 rounded-xl border border-navy/10 flex flex-col md:flex-row items-start md:items-center gap-4.5">
                {/* Description */}
                <div className="flex-grow w-full md:w-auto">
                  <Input
                    label="Description"
                    placeholder="Enter item description..."
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                    required
                  />
                </div>

                {/* Quantity */}
                <div className="w-full md:w-24">
                  <Input
                    label="Qty"
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    required
                  />
                </div>

                {/* Rate */}
                <div className="w-full md:w-36">
                  <Input
                    label="Rate (₹)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.rate}
                    onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                    required
                  />
                </div>

                {/* GST Rate */}
                <div className="w-full md:w-28 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary select-none">
                    GST Rate
                  </label>
                  <select
                    value={item.gstRate}
                    onChange={(e) => handleItemChange(idx, 'gstRate', e.target.value)}
                    className="glass-input px-4 py-3 rounded-xl text-navy text-base shadow-sm focus:outline-none w-full"
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>

                {/* Row Subtotal */}
                <div className="w-full md:w-32 flex flex-col gap-1 md:text-right shrink-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Amount</span>
                  <span className="text-base font-extrabold text-navy py-2">
                    {formatCurrency(item.amount)}
                  </span>
                </div>

                {/* Action button */}
                {items.length > 1 && (
                  <button
                    onClick={() => removeLineItem(idx)}
                    className="p-2 hover:bg-rose-500/10 text-text-secondary hover:text-red-500 rounded-xl self-end md:self-center shrink-0 mt-3 md:mt-0 transition-colors"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* STEP 4: REVIEW SUMMARY */}
      {step === 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notes & Terms input panel */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <GlassCard className="p-6 border-navy/5 shadow-sm flex flex-col gap-5">
              <h3 className="text-base font-extrabold text-navy">Invoice Notes</h3>
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Notes & Reminders</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Provide client bank transfer codes, transaction references, or personal remarks..."
                  rows={3}
                  className="glass-input px-4 py-3 rounded-xl text-navy text-base shadow-sm focus:outline-none w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Terms & Conditions</label>
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="E.g. Invoice due within 30 days. Late accounts subject to a 1.5% monthly service charge..."
                  rows={3}
                  className="glass-input px-4 py-3 rounded-xl text-navy text-base shadow-sm focus:outline-none w-full"
                />
              </div>
            </GlassCard>
          </div>

          {/* Real-time Math Summary Widget */}
          <div className="lg:col-span-1">
            <GlassCard className="p-6 border-navy/5 shadow-sm bg-gradient-to-br from-white to-navy/5 flex flex-col gap-6 sticky top-24">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-secondary">Subtotals Summary</h3>
              
              <div className="flex flex-col gap-3.5 border-b border-navy/10 pb-4">
                <div className="flex justify-between items-center text-xs font-semibold text-text-secondary">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs font-semibold text-text-secondary">
                  <span>GST Amount:</span>
                  <span>{formatCurrency(gstTotal)}</span>
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

              <div className="flex justify-between items-center pt-2 border-t border-navy/10">
                <span className="text-sm font-extrabold text-navy">Total Balance (INR):</span>
                <span className="text-lg font-extrabold text-green">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* STEP 5: FINALIZE */}
      {step === 5 && (
        <GlassCard className="p-8 border-navy/5 shadow-sm text-center flex flex-col items-center max-w-xl mx-auto gap-6 bg-gradient-to-br from-white to-green/5">
          <div className="h-16 w-16 bg-green/10 text-green rounded-full flex items-center justify-center text-2xl font-bold animate-float-medium">
            📝
          </div>
          <div>
            <h3 className="text-base font-extrabold text-navy">Validate Invoicing Parameters</h3>
            <p className="text-xs text-text-secondary font-semibold mt-2 leading-relaxed">
              Confirm metadata variables, client billing records, and tax calculations. Select "Save Draft" to keep it editable or "Save & Issue" to mark it Sent.
            </p>
          </div>

          {/* Quick Recap */}
          <div className="w-full bg-navy/5 border border-navy/10 rounded-2xl p-4 text-left flex flex-col gap-2.5">
            <div className="flex justify-between text-xs font-bold text-navy">
              <span>Client Entity:</span>
              <span>{selectedClient?.name || 'Loading client...'}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-navy">
              <span>Payment Due:</span>
              <span>{new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-green border-t border-navy/10 pt-2 mt-1">
              <span>Grand Total Amount:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center pt-2">
            <Button
              variant="outline"
              isLoading={savingInvoice}
              onClick={() => handleSubmitInvoice('Draft')}
              className="flex items-center gap-2 py-3 px-6 text-xs font-bold border-navy/20 hover:border-navy/40"
            >
              <Save className="h-4.5 w-4.5" />
              Save Draft
            </Button>
            <Button
              variant="secondary"
              isLoading={savingInvoice}
              onClick={() => handleSubmitInvoice('Sent')}
              className="flex items-center gap-2 py-3 px-6 text-xs font-bold bg-[#0C4737] text-white hover:bg-green-dark"
            >
              <Send className="h-4.5 w-4.5" />
              Save & Issue Sent
            </Button>
          </div>
        </GlassCard>
      )}

      {/* FOOTER WIZARD NAVIGATION BAR */}
      <div className="flex justify-between items-center bg-white border border-navy/5 p-4 rounded-2xl shadow-sm mt-4">
        <Button
          variant="outline"
          disabled={step === 1}
          onClick={prevStep}
          className="flex items-center gap-1.5 text-xs font-bold py-2.5 px-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {step < 5 ? (
          <Button
            variant="primary"
            onClick={nextStep}
            className="flex items-center gap-1.5 text-xs font-bold py-2.5 px-4"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <div className="w-20"></div> // placeholder
        )}
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
