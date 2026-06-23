import mongoose, { Schema, Document } from 'mongoose';

export interface IBusiness extends Document {
  tenantId: string;
  name: string;
  type: 'freelancer' | 'agency' | 'business';
  email?: string;
  phone?: string;
  legalName?: string;
  website?: string;
  industry?: string;
  // Address
  address?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country: string;
  // Tax identifiers
  gstNumber?: string;
  panNumber?: string;
  taxRegistrationNumber?: string;
  // Branding
  logoBase64?: string; // base64-encoded image, stored in DB
  bannerBase64?: string;
  // Invoice config
  invoicePrefix: string;
  invoiceNextNumber: number;
  currency: string;
  timeZone?: string;
  invoiceNumberFormat?: string;
  // Notification preferences
  remindersEnabled?: boolean;
  remindersIntervals?: number[];
  // Bank details (shown on printed invoice)
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
  bankUpi?: string;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema: Schema = new Schema(
  {
    tenantId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['freelancer', 'agency', 'business'],
      default: 'freelancer'
    },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    legalName: { type: String, trim: true },
    website: { type: String, trim: true },
    industry: { type: String, trim: true },
    // Address
    address: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    country: { type: String, default: 'India' },
    // Tax
    gstNumber: { type: String, trim: true, uppercase: true },
    panNumber: { type: String, trim: true, uppercase: true },
    taxRegistrationNumber: { type: String, trim: true },
    // Branding – base64 stored in DB
    logoBase64: { type: String },
    bannerBase64: { type: String },
    // Invoice config
    invoicePrefix: { type: String, default: 'INV', trim: true },
    invoiceNextNumber: { type: Number, default: 1, min: 1 },
    currency: { type: String, default: 'INR' },
    timeZone: { type: String, default: 'Asia/Kolkata', trim: true },
    invoiceNumberFormat: { type: String, default: '{prefix}-{number}', trim: true },
    // Notification preferences
    remindersEnabled: { type: Boolean, default: true },
    remindersIntervals: { type: [Number], default: [7, 14, 30] },
    // Bank details
    bankName: { type: String, trim: true },
    bankAccount: { type: String, trim: true },
    bankIfsc: { type: String, trim: true, uppercase: true },
    bankUpi: { type: String, trim: true }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IBusiness>('Business', BusinessSchema);
