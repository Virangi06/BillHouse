import mongoose, { Schema, Document } from 'mongoose';

export interface IClient extends Document {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  taxId?: string; // GSTIN / VAT / tax identifier
  tenantId: string; // The tenant space partition ID
  createdBy: mongoose.Types.ObjectId; // The user who created this client record
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      lowercase: true, 
      trim: true 
    },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    taxId: { type: String, trim: true },
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

export default mongoose.model<IClient>('Client', ClientSchema);
