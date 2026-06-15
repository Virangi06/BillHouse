import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  invoice: mongoose.Types.ObjectId;
  tenantId: string;
  amount: number;
  date: Date;
  method: 'UPI' | 'Bank Transfer' | 'Cash' | 'Card';
  transactionId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    invoice: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    tenantId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    method: {
      type: String,
      enum: ['UPI', 'Bank Transfer', 'Cash', 'Card'],
      default: 'UPI',
      required: true
    },
    transactionId: { type: String, trim: true },
    notes: { type: String, trim: true }
  },
  {
    timestamps: true
  }
);

// Compound index for multi-tenant queries
PaymentSchema.index({ tenantId: 1, invoice: 1 });

export default mongoose.model<IPayment>('Payment', PaymentSchema);
