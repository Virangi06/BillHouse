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
  unit: 'hours' | 'days' | 'months' | 'items' | 'projects';
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
    { description: '', quantity: 1, rate: 0, unit: 'items', gstRate: 18, amount: 0 }
  ]);
  
  // Wizard and Discount states
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [tdsRate, setTdsRate] = useState<number>(0);
  const [template, setTemplate] = useState<'Modern' | 'Classic' | 'Minimal'>('Modern');
  const [colorTheme, setColorTheme] = useState<string>('#3b4b5c');
  
  const [notes, setNotes] = useState<string>('');
  const [terms, setTerms] = useState<string>('');

  const steps = [
    { id: 1, name: 'Client Selection' },
    { id: 2, name: 'Invoice Settings' },
    { id: 3, name: 'Line Items' },
    { id: 4, name: 'Review & Actions' }
  ];

  // Fetch all clients
  const fetchClients = async () => {
    try {
      const res = await API.get<Client[]>('/clients');
      setClients(res.data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to load client directory');
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
        unit: it.unit || 'items',
        gstRate: it.gstRate,
        amount: it.amount
      }));
      setItems(mappedItems);
      
      setDiscountValue(inv.discountAmount || 0);
      setDiscountType('flat');
      setTdsRate(inv.tdsRate || 0);
      setTemplate(inv.template || 'Modern');
      setColorTheme(inv.colorTheme || '#3b4b5c');
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

  // Load specific client if it's referenced but missing from active clients (e.g. if archived)
  useEffect(() => {
    const checkAndFetchSelectedClient = async () => {
      if (selectedClientId && clients.length > 0 && !clients.some(c => c._id === selectedClientId)) {
        try {
          const res = await API.get<Client>(`/clients/${selectedClientId}`);
          if (res.data) {
            setClients(prev => {
              if (prev.some(c => c._id === res.data._id)) return prev;
              return [...prev, res.data];
            });
          }
        } catch (err) {
          console.warn('Failed to fetch selected client', err);
        }
      }
    };
    checkAndFetchSelectedClient();
  }, [selectedClientId, clients]);

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
    } else if (field === 'unit') {
      item.unit = value;
    } else if (field === 'description') {
      item.description = value;
    }

    updatedItems[index] = item;
    setItems(updatedItems);
  };

  const addLineItem = () => {
    setItems([...items, { description: '', quantity: 1, rate: 0, unit: 'items', gstRate: 18, amount: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Math totals calculation
  const subtotal = items.reduce((acc, curr) => acc + curr.amount, 0);
  const gstTotal = items.reduce((acc, curr) => acc + (curr.amount * (curr.gstRate / 100)), 0);
  const discountAmount = discountType === 'percent'
    ? Math.round(subtotal * (discountValue / 100))
    : discountValue;
  const totalAmount = Math.max(0, subtotal + gstTotal - discountAmount);

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

  const validateStep = (step: number): boolean => {
    setErrorMsg(null);
    if (step === 1) {
      if (!selectedClientId) {
        setErrorMsg('Please select a client first');
        return false;
      }
    } else if (step === 2) {
      if (!date) {
        setErrorMsg('Please select an issue date');
        return false;
      }
      if (!dueDate) {
        setErrorMsg('Please select a due date');
        return false;
      }
    } else if (step === 3) {
      if (items.length === 0) {
        setErrorMsg('At least one line item is required');
        return false;
      }
      if (items.some(item => !item.description.trim())) {
        setErrorMsg('All line items must have a description');
        return false;
      }
      if (items.some(item => item.quantity <= 0)) {
        setErrorMsg('Quantity must be greater than 0');
        return false;
      }
      if (items.some(item => item.rate < 0)) {
        setErrorMsg('Rate cannot be negative');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmitInvoice = async (status: 'Draft' | 'Sent') => {
    // Validate all steps up to Step 3
    for (let step = 1; step <= 3; step++) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        return;
      }
    }

    try {
      setSavingInvoice(true);
      setErrorMsg(null);

      const payload = {
        clientId: selectedClientId,
        date,
        dueDate,
        discountAmount,
        tdsRate,
        template,
        colorTheme,
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

      {/* Stepper progress tracker */}
      <div className="bg-white border border-navy/5 p-5 rounded-2xl shadow-sm">
        {/* Desktop Stepper */}
        <div className="hidden md:flex justify-between items-center relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-navy/10 -translate-y-1/2 z-0"></div>
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-green -translate-y-1/2 transition-all duration-300 z-0"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          ></div>

          {steps.map((s) => {
            const isCompleted = currentStep > s.id;
            const isActive = currentStep === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  let isValid = true;
                  for (let i = 1; i < s.id; i++) {
                    if (!validateStep(i)) {
                      setCurrentStep(i);
                      isValid = false;
                      break;
                    }
                  }
                  if (isValid) {
                    setErrorMsg(null);
                    setCurrentStep(s.id);
                  }
                }}
                className="flex flex-col items-center gap-2 relative z-10 focus:outline-none"
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs transition-all border-2 ${
                  isCompleted 
                    ? 'bg-green border-green text-white' 
                    : isActive 
                      ? 'bg-white border-green text-green shadow-md scale-110 ring-4 ring-green/10' 
                      : 'bg-white border-navy/10 text-text-secondary'
                }`}>
                  {isCompleted ? '✓' : s.id}
                </div>
                <span className={`text-[11px] font-extrabold tracking-tight transition-all ${
                  isActive ? 'text-green' : isCompleted ? 'text-navy' : 'text-text-secondary'
                }`}>
                  {s.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile Stepper */}
        <div className="flex md:hidden items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Step {currentStep} of 4</span>
            <span className="text-sm font-black text-navy">{steps[currentStep - 1].name}</span>
          </div>
          <div className="flex gap-1">
            {steps.map((s) => (
              <div 
                key={s.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentStep === s.id 
                    ? 'w-6 bg-green' 
                    : currentStep > s.id 
                      ? 'w-2 bg-navy' 
                      : 'w-2 bg-navy/10'
                }`}
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Wizard Steps Containers */}
      <div className="w-full flex flex-col gap-6">
        
        {/* Step 1: Choose Client */}
        {currentStep === 1 && (
          <GlassCard className="p-6 border-navy/5 bg-white shadow-sm flex flex-col gap-6 w-full max-w-3xl mx-auto">
            <div className="flex justify-between items-center border-b border-navy/5 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-navy">Client Billing Details</h3>
                <p className="text-xs text-text-secondary font-semibold mt-1">Select a client from your registry or register a new one.</p>
              </div>
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

            <div className="flex flex-col gap-2 w-full">
              <label className="text-xs font-bold text-navy select-none">Select Client</label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="glass-input px-4 py-3 rounded-xl text-navy text-sm font-semibold shadow-sm focus:outline-none w-full cursor-pointer bg-white"
              >
                <option value="">-- Choose Client --</option>
                {clients.map(c => (
                  <option key={c._id} value={c._id}>{c.name} ({c.email})</option>
                ))}
              </select>
            </div>

            {selectedClient && (
              <div className="p-5 bg-navy/5 border border-navy/10 rounded-2xl text-xs flex flex-col gap-2 font-semibold text-text-secondary animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                  <span className="text-navy font-extrabold text-sm">{selectedClient.name}</span>
                  <span className="text-[11px]">✉ {selectedClient.email}</span>
                </div>
                {selectedClient.address && <p className="leading-relaxed">📍 {selectedClient.address}</p>}
                {selectedClient.phone && <p>📞 {selectedClient.phone}</p>}
                {selectedClient.taxId && <p className="font-bold text-navy">GSTIN: {selectedClient.taxId}</p>}
              </div>
            )}

            {/* Validation Message - Localized at the bottom of the box */}
            {errorMsg && (
              <div className="p-3.5 bg-danger/10 border border-danger/35 text-danger text-xs font-bold rounded-xl animate-float-fast flex items-center gap-2">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-navy/5">
              <Button
                type="button"
                variant="primary"
                onClick={handleNextStep}
                className="flex items-center gap-1.5 py-2.5 px-5 text-xs font-extrabold bg-green hover:bg-green-dark text-white rounded-xl"
              >
                Proceed to Settings
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </GlassCard>
        )}

        {/* Step 2: Invoice Settings */}
        {currentStep === 2 && (
          <GlassCard className="p-6 border-navy/5 bg-white shadow-sm flex flex-col gap-6 w-full max-w-3xl mx-auto">
            <div className="border-b border-navy/5 pb-4">
              <h3 className="text-base font-extrabold text-navy">Invoice Settings</h3>
              <p className="text-xs text-text-secondary font-semibold mt-1">Provide invoice date information.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary select-none">Invoice Number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  disabled
                  className="glass-input px-3.5 py-3 rounded-xl text-navy/50 bg-navy/5 cursor-not-allowed text-xs shadow-sm focus:outline-none w-full font-bold"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary select-none">Issue Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="glass-input px-3.5 py-3 rounded-xl text-navy text-xs font-semibold shadow-sm focus:outline-none w-full bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary select-none">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="glass-input px-3.5 py-3 rounded-xl text-navy text-xs font-semibold shadow-sm focus:outline-none w-full bg-white"
                />
              </div>
            </div>

            <div className="border-t border-navy/5 pt-5 flex flex-col gap-4">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary select-none">Design & Customization</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Template Select */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy select-none">Invoice Layout Template</label>
                  <select
                    value={template}
                    onChange={(e) => setTemplate(e.target.value as any)}
                    className="glass-input px-4 py-3 rounded-xl text-navy text-xs font-semibold shadow-sm focus:outline-none w-full cursor-pointer bg-white"
                  >
                    <option value="Modern">Modern (Centered, Clean Grid)</option>
                    <option value="Classic">Classic (Bold Corporate Branding)</option>
                    <option value="Minimal">Minimal (Clean Monochrome Lines)</option>
                  </select>
                </div>

                {/* Color Theme Swatch */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy select-none">Branding Color Theme</label>
                  <div className="flex items-center gap-3 mt-1">
                    {[
                      { name: 'Slate Blue', hex: '#3b4b5c' },
                      { name: 'Forest Green', hex: '#0c4737' },
                      { name: 'Dark Navy', hex: '#061b2d' },
                      { name: 'Steel Gray', hex: '#5f6b76' },
                      { name: 'Teal Accent', hex: '#2f8f7a' }
                    ].map((color) => (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => setColorTheme(color.hex)}
                        style={{ backgroundColor: color.hex }}
                        className={`h-8 w-8 rounded-full border-2 transition-all relative group cursor-pointer ${
                          colorTheme === color.hex 
                            ? 'ring-2 ring-green ring-offset-2 scale-110' 
                            : 'border-transparent hover:scale-105'
                        }`}
                        title={color.name}
                      >
                        {colorTheme === color.hex && (
                          <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">
                            ✓
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Validation Message - Localized at the bottom of the box */}
            {errorMsg && (
              <div className="p-3.5 bg-danger/10 border border-danger/35 text-danger text-xs font-bold rounded-xl animate-float-fast flex items-center gap-2">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-navy/5">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="flex items-center gap-1.5 py-2.5 px-4 text-xs font-bold border-navy/20 text-navy hover:bg-navy/5"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleNextStep}
                className="flex items-center gap-1.5 py-2.5 px-5 text-xs font-extrabold bg-green hover:bg-green-dark text-white rounded-xl"
              >
                Proceed to Line Items
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </GlassCard>
        )}

        {/* Step 3: Line Items Directory */}
        {currentStep === 3 && (
          <GlassCard className="p-6 border-navy/5 bg-white shadow-sm flex flex-col gap-6 w-full">
            <div className="flex justify-between items-center border-b border-navy/5 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-navy">Line Items Directory</h3>
                <p className="text-xs text-text-secondary font-semibold mt-1">Specify items, services, quantities, and GST tax brackets.</p>
              </div>
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

            {/* Desktop & Mobile Spreadsheet Table container */}
            <div className="overflow-x-auto w-full -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full text-left border-collapse text-xs table-fixed">
                <thead>
                  <tr className="border-b border-navy/10 bg-navy/5 text-text-secondary uppercase text-[10px] tracking-wider font-extrabold">
                    <th className="py-2.5 px-3 min-w-[200px] w-5/12">Description</th>
                    <th className="py-2.5 px-3 text-right min-w-[90px] w-1.5/12">Unit</th>
                    <th className="py-2.5 px-3 text-right min-w-[75px] w-1/12">Qty</th>
                    <th className="py-2.5 px-3 text-right min-w-[105px] w-1.5/12">Rate (₹)</th>
                    <th className="py-2.5 px-3 text-right min-w-[85px] w-1.5/12">GST %</th>
                    <th className="py-2.5 px-3 text-right min-w-[95px] w-1.5/12">Amount</th>
                    <th className="py-2.5 px-3 text-center min-w-[40px] w-0.5/12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-cream/40 transition-colors">
                      <td className="py-2.5 px-3 min-w-[200px]">
                        <input
                          type="text"
                          required
                          placeholder="Service or product description..."
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="w-full bg-white border border-navy/10 rounded-xl px-3 py-2.5 text-xs text-navy focus:outline-none focus:border-green font-semibold"
                        />
                      </td>
                      <td className="py-2.5 px-3 min-w-[90px]">
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          className="w-full bg-white border border-navy/10 rounded-xl px-2 py-2.5 text-xs text-navy focus:outline-none focus:border-green font-semibold cursor-pointer"
                        >
                          <option value="items">items</option>
                          <option value="hours">hours</option>
                          <option value="days">days</option>
                          <option value="months">months</option>
                          <option value="projects">projects</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-3 min-w-[75px]">
                        <input
                          type="number"
                          required
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full bg-white border border-navy/10 rounded-xl px-2 py-2.5 text-xs text-navy focus:outline-none focus:border-green font-semibold text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>
                      <td className="py-2.5 px-3 min-w-[110px]">
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                          className="w-full bg-white border border-navy/10 rounded-xl px-2 py-2.5 text-xs text-navy focus:outline-none focus:border-green font-semibold text-right"
                        />
                      </td>
                      <td className="py-2.5 px-3 min-w-[95px]">
                        <select
                          value={item.gstRate}
                          onChange={(e) => handleItemChange(idx, 'gstRate', e.target.value)}
                          className="w-full bg-white border border-navy/10 rounded-xl px-2 py-2.5 text-xs text-navy focus:outline-none focus:border-green font-semibold cursor-pointer"
                        >
                          <option value={0}>0%</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                          <option value={28}>28%</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-navy select-none min-w-[100px]">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-center min-w-[50px]">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLineItem(idx)}
                            className="p-1.5 hover:bg-rose-500/10 text-text-secondary hover:text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Validation Message - Localized at the bottom of the box */}
            {errorMsg && (
              <div className="p-3.5 bg-danger/10 border border-danger/35 text-danger text-xs font-bold rounded-xl animate-float-fast flex items-center gap-2">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-navy/5">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="flex items-center gap-1.5 py-2.5 px-4 text-xs font-bold border-navy/20 text-navy hover:bg-navy/5"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleNextStep}
                className="flex items-center gap-1.5 py-2.5 px-5 text-xs font-extrabold bg-green hover:bg-green-dark text-white rounded-xl"
              >
                Review & Actions
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </GlassCard>
        )}

        {/* Step 4: Summary, Remarks & Actions */}
        {currentStep === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
            {/* Left Column - Calculations & Remarks */}
            <div className="lg:col-span-8 flex flex-col gap-6 w-full">
              {/* Math Summary Widget */}
              <GlassCard className="p-6 border-navy/5 bg-gradient-to-br from-white to-navy/5 shadow-sm flex flex-col gap-4">
                <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary border-b border-navy/5 pb-2">Invoice Summary</h3>
                
                <div className="flex flex-col gap-3 border-b border-navy/10 pb-4">
                  <div className="flex justify-between items-center text-xs font-semibold text-text-secondary">
                    <span>Subtotal:</span>
                    <span className="font-bold text-navy">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold text-text-secondary">
                    <span>GST Tax (₹):</span>
                    <span className="font-bold text-navy">{formatCurrency(gstTotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-xs font-semibold text-rose-500">
                      <span>Applied Discount:</span>
                      <span className="font-bold">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 items-end w-full">
                  <div className="flex-1">
                    <Input
                      label={`Discount Value (${discountType === 'percent' ? '%' : '₹'})`}
                      type="number"
                      min="0"
                      max={discountType === 'percent' ? 100 : subtotal + gstTotal}
                      step={discountType === 'percent' ? '0.1' : '1'}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>
                  <div className="flex bg-navy/5 p-1 rounded-xl border border-navy/10 h-[46px] items-center mb-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType('flat');
                        if (discountType === 'percent') {
                          setDiscountValue(Math.round(subtotal * (discountValue / 100)));
                        }
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${discountType === 'flat' ? 'bg-white text-navy shadow-sm' : 'text-text-secondary hover:text-navy'}`}
                    >
                      ₹
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType('percent');
                        if (discountType === 'flat') {
                          setDiscountValue(subtotal > 0 ? parseFloat(((discountValue / subtotal) * 100).toFixed(1)) : 0);
                        }
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${discountType === 'percent' ? 'bg-white text-navy shadow-sm' : 'text-text-secondary hover:text-navy'}`}
                    >
                      %
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-xs font-bold text-navy select-none">TDS Rate (%)</label>
                  <select
                    value={tdsRate}
                    onChange={(e) => setTdsRate(parseFloat(e.target.value) || 0)}
                    className="glass-input px-4 py-3 rounded-xl text-navy text-xs font-semibold shadow-sm focus:outline-none w-full cursor-pointer bg-white"
                  >
                    <option value={0}>0% (No TDS)</option>
                    <option value={1}>1% (TDS - Individuals/HUF)</option>
                    <option value={2}>2% (TDS - Companies/Partnerships/Services)</option>
                    <option value={5}>5% (TDS - Commission/Brokerage)</option>
                    <option value={10}>10% (TDS - Professional/Technical Services)</option>
                  </select>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-navy/10 mt-1">
                  <span className="text-xs font-extrabold text-navy">Grand Total:</span>
                  <span className="text-lg font-black text-green">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>

                {tdsRate > 0 && (
                  <div className="p-3 bg-navy/5 border border-navy/10 rounded-xl mt-2 flex flex-col gap-1 animate-fade-in">
                    <div className="flex justify-between items-center text-xs font-semibold text-text-secondary">
                      <span>Estimated TDS ({tdsRate}%):</span>
                      <span className="font-bold text-navy">-{formatCurrency(Math.round((subtotal - discountAmount) * (tdsRate / 100)))}</span>
                    </div>
                    <span className="text-[10px] text-text-secondary italic">
                      *Estimated TDS deduction at payment: {formatCurrency(Math.round((subtotal - discountAmount) * (tdsRate / 100)))}
                    </span>
                  </div>
                )}
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

            {/* Right Column - Actions Card */}
            <div className="lg:col-span-4 flex flex-col gap-4 w-full sticky lg:top-24">
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

                {/* Validation Message - Localized at the bottom of the box */}
                {errorMsg && (
                  <div className="mt-2 p-3.5 bg-danger/10 border border-danger/35 text-danger text-xs font-bold rounded-xl animate-float-fast flex items-center gap-2">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </GlassCard>

              <div className="flex justify-start">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  className="flex items-center gap-1.5 py-2.5 px-4 text-xs font-bold border-navy/20 text-navy hover:bg-navy/5 w-full justify-center"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to Line Items
                </Button>
              </div>
            </div>
          </div>
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
