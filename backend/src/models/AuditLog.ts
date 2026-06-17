import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  tenantId: string;
  userId: mongoose.Types.ObjectId;
  userName: string;
  action: string;
  details: string;
  ipAddress?: string;
  timestamp: Date;
}

const AuditLogSchema: Schema = new Schema({
  tenantId: { type: String, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String, required: true },
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now }
});

// Index for fast tenant log history retrieval
AuditLogSchema.index({ tenantId: 1, timestamp: -1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
