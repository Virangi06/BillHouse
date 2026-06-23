import AuditLog from '../models/AuditLog';

interface AuditLogParams {
  tenantId: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  ipAddress?: string;
}

/**
 * Write an audit log entry to MongoDB.
 * This is fire-and-forget — it never throws or blocks the calling route.
 * On DB failure, the error is silently logged to console only.
 */
export function logAudit(params: AuditLogParams): void {
  const { tenantId, userId, userName, action, details, ipAddress } = params;

  AuditLog.create({
    tenantId,
    userId,
    userName,
    action,
    details,
    ipAddress: ipAddress || 'unknown',
    timestamp: new Date()
  }).catch((err: any) => {
    // Never crash the caller — just log to console
    console.error(`⚠️ AuditLog write failed [${action}]:`, err?.message || err);
  });
}

// ─── Audit Action Constants ────────────────────────────────────────────────────
// Use these constants for consistency across all route files

export const AuditActions = {
  // Invoice actions
  INVOICE_CREATED:        'INVOICE_CREATED',
  INVOICE_UPDATED:        'INVOICE_UPDATED',
  INVOICE_STATUS_CHANGED: 'INVOICE_STATUS_CHANGED',
  INVOICE_DELETED:        'INVOICE_DELETED',
  INVOICE_SENT:           'INVOICE_SENT',
  INVOICE_REMINDER_SENT:  'INVOICE_REMINDER_SENT',

  // Payment actions
  PAYMENT_RECORDED:       'PAYMENT_RECORDED',
  PAYMENT_VOIDED:         'PAYMENT_VOIDED',

  // Client actions
  CLIENT_CREATED:         'CLIENT_CREATED',
  CLIENT_UPDATED:         'CLIENT_UPDATED',
  CLIENT_ARCHIVED:        'CLIENT_ARCHIVED',
  CLIENT_REACTIVATED:     'CLIENT_REACTIVATED',

  // Auth / account actions (reserved for future use)
  USER_LOGIN:             'USER_LOGIN',
  USER_PASSWORD_RESET:    'USER_PASSWORD_RESET',
  BUSINESS_PROFILE_SAVED: 'BUSINESS_PROFILE_SAVED',
} as const;
