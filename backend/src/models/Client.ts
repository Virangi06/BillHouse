import mongoose, { Schema, Document } from 'mongoose';

export interface IClient extends Document {
  name: string;
  companyName?: string;   // Company / organization name (optional, separate from contact name)
  email: string;
  phone?: string;
  address?: string;
  country?: string;       // Country for filtering purposes
  taxId?: string;         // Generic tax identifier (VAT, etc.)
  gstNumber?: string;     // India-specific GST number (GSTIN)
  notes?: string;         // Internal notes / special instructions
  tenantId: string;       // The tenant space partition ID
  createdBy: mongoose.Types.ObjectId; // The user who created this client record
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    companyName: { type: String, trim: true },
    email: { 
      type: String, 
      required: true, 
      lowercase: true, 
      trim: true 
    },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    country: { type: String, trim: true, default: 'India' },
    taxId: { type: String, trim: true },
    gstNumber: { type: String, trim: true, uppercase: true },
    notes: { type: String, trim: true },
    tenantId: { type: String, required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure fast search lookup within a tenant space
ClientSchema.index({ tenantId: 1, name: 1 });
ClientSchema.index({ tenantId: 1, email: 1 });
ClientSchema.index({ tenantId: 1, country: 1 });

export default mongoose.model<IClient>('Client', ClientSchema);
