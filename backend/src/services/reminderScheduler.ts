import Invoice from '../models/Invoice';
import Business from '../models/Business';
import Client from '../models/Client';
import { sendPaymentReminderEmail } from './emailService';
import { logAudit, AuditActions } from './auditService';

/**
 * Scan all active, unpaid invoices and dispatch automated email reminders
 * based on tenant settings (Day 7, 14, 30 overdue).
 */
export async function runDailyReminders(): Promise<void> {
  console.log('⏰ Starting daily automated payment reminders check...');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch all unpaid invoices that are active (Sent, Viewed, Partially Paid, Overdue)
    const unpaidInvoices = await Invoice.find({
      status: { $in: ['Sent', 'Viewed', 'Partially Paid', 'Overdue'] }
    });

    console.log(`🔍 Found ${unpaidInvoices.length} unpaid invoices to evaluate for reminders.`);

    let sentCount = 0;

    for (const invoice of unpaidInvoices) {
      // 1. Fetch business profile
      const business = await Business.findOne({ tenantId: invoice.tenantId });
      if (!business) {
        // No business profile found, cannot send email
        continue;
      }

      // Check if reminders are enabled (default to true)
      const remindersEnabled = business.remindersEnabled !== false;
      if (!remindersEnabled) {
        continue;
      }

      // Intervals (default to [7, 14, 30])
      const intervals = business.remindersIntervals || [7, 14, 30];

      // 2. Compute days elapsed since dueDate
      const dueDate = new Date(invoice.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // 3. Check if diffDays matches one of the intervals
      if (intervals.includes(diffDays)) {
        const reminderType = `${diffDays}d`; // '7d', '14d', '30d'

        // Check if reminder was already sent
        const alreadySent = invoice.remindersSent?.some(r => r.type === reminderType);
        if (alreadySent) {
          continue;
        }

        // Fetch client details
        const clientObj = await Client.findById(invoice.client);
        if (!clientObj || !clientObj.email) {
          continue;
        }

        // Send payment reminder email
        try {
          console.log(`✉️ Sending automated ${reminderType} reminder to ${clientObj.email} for Invoice ${invoice.number}...`);
          await sendPaymentReminderEmail(clientObj.email, clientObj.name, invoice, business);

          // Track reminder sent on invoice
          if (!invoice.remindersSent) {
            invoice.remindersSent = [];
          }
          invoice.remindersSent.push({
            type: reminderType as any,
            sentAt: new Date()
          });
          await invoice.save();

          // Write audit log
          logAudit({
            tenantId: invoice.tenantId,
            userId: 'system',
            userName: 'System Scheduler',
            action: AuditActions.INVOICE_REMINDER_SENT,
            details: `Automated ${diffDays}-day payment reminder emailed to ${clientObj.email} for invoice ${invoice.number}`
          });

          sentCount++;
        } catch (emailErr) {
          console.error(`❌ Failed to send automated reminder for invoice ${invoice.number}:`, emailErr);
        }
      }
    }

    console.log(`✅ Daily automated payment reminders check completed. Sent ${sentCount} reminders.`);
  } catch (err) {
    console.error('❌ Error in runDailyReminders:', err);
  }
}
