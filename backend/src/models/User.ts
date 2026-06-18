import mongoose, { Schema, Document } from 'mongoose';
import bcryptjs from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  businessName?: string;  // Optional business/company name collected at registration
  email: string;
  passwordHash: string;
  tenantId: string;
  role: 'Admin' | 'Accountant' | 'Viewer';
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    businessName: { type: String, trim: true },  // Optional business name from registration
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    passwordHash: { type: String, required: true },
    tenantId: { type: String, required: true, index: true },
    role: { type: String, enum: ['Admin', 'Accountant', 'Viewer'], default: 'Admin' },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpires: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
  },
  {
    timestamps: true
  }
);

// Method to verify password match
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcryptjs.compare(password, this.passwordHash);
};

export default mongoose.model<IUser>('User', UserSchema);
