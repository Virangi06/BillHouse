import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  unit: 'hours' | 'days' | 'months' | 'items' | 'projects'; // unit type on line items
  gstRate: number; // e.g. 0, 5, 12, 18, 28
  amount: number; // quantity * rate
  createdAt: Date;
}

export interface IInvoice extends Document {
  tenantId: string;
  businessId?: string; // Links to tenant profile
  client: mongoose.Types.ObjectId; // References Client model
  clientName: string;
  number: string; // INV-000001
  date: Date; // issueDate
  dueDate: Date;
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
  currency: string; // Defaults to "INR"
  sentAt?: Date;
  paidAt?: Date;
  items: IInvoiceItem[];
  createdBy: mongoose.Types.ObjectId; // References User model
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema: Schema = new Schema({
  description: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 1 },
  rate: { type: Number, required: true, min: 0 },
  unit: { 
    type: String, 
    required: true, 
    default: 'items',
    enum: ['hours', 'days', 'months', 'items', 'projects']
  },
  gstRate: { type: Number, required: true, default: 18 },
  amount: { type: Number, required: true, min: 0 }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

const InvoiceSchema: Schema = new Schema(
  {
    number: { type: String, required: true, trim: true },
    tenantId: { type: String, required: true, index: true },
    businessId: { type: String, trim: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    clientName: { type: String, required: true, trim: true },
    date: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Viewed', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'],
      default: 'Draft',
      required: true
    },
    subtotal: { type: Number, required: true, min: 0 },
    gstAmount: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    tdsRate: { type: Number, default: 0, min: 0 },
    tdsAmount: { type: Number, default: 0, min: 0 },
    template: {
      type: String,
      enum: ['Modern', 'Classic', 'Minimal'],
      default: 'Modern',
      required: true
    },
    colorTheme: { type: String, default: '#3b4b5c', required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    amountDue: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true },
    terms: { type: String, trim: true },
    currency: { type: String, default: 'INR', required: true },
    sentAt: { type: Date },
    paidAt: { type: Date },
    items: [InvoiceItemSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  {
    timestamps: true
  }
);

// Compound indices for multi-tenant scopes
InvoiceSchema.index({ tenantId: 1, number: 1 }, { unique: false });
InvoiceSchema.index({ tenantId: 1, status: 1 });
InvoiceSchema.index({ tenantId: 1, client: 1 });

export default mongoose.model<IInvoice>('Invoice', InvoiceSchema);
