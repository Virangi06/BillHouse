import { Router, Response } from 'express';
import Payment from '../models/Payment';
import Invoice from '../models/Invoice';
import Client from '../models/Client';
import Business from '../models/Business';
import { AuthRequest } from '../middleware/authMiddleware';
import mongoose from 'mongoose';
import { sendPaymentConfirmationEmail } from '../services/emailService';
import { logAudit, AuditActions } from '../services/auditService';

const router = Router();

// 0. GET ALL PAYMENTS FOR TENANT (GET /)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { tenantId } = req.user;

    // Find all payment logs and populate associated invoice details
    const payments = await Payment.find({ tenantId })
      .populate('invoice', 'number clientName totalAmount amountDue status')
      .sort({ date: -1 });

    return res.status(200).json(payments);
  } catch (error) {
    console.error('❌ Get all payments error:', error);
    return res.status(500).json({ error: 'Server error fetching payments registry list' });
  }
});

// 1. RECORD A PAYMENT (POST /)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { tenantId } = req.user;
    const { invoiceId, amount, date, method, transactionId, notes } = req.body;

    if (!invoiceId || !amount || !method) {
      return res.status(400).json({ error: 'Invoice ID, amount, and payment method are required fields' });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be a number greater than 0' });
    }

    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({ error: 'Invalid invoice ID format' });
    }

    // Load invoice and verify tenantId matching
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    if (invoice.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Access denied to this tenant resource' });
    }

    // Check remaining balance
    if (parsedAmount > invoice.amountDue) {
      return res.status(400).json({ 
        error: `Payment amount (₹${parsedAmount}) exceeds the remaining balance due (₹${invoice.amountDue})` 
      });
    }

    // Create Payment record
    const payment = new Payment({
      invoice: invoiceId,
      tenantId,
      amount: parsedAmount,
      date: date ? new Date(date) : new Date(),
      method,
      transactionId,
      notes
    });

    await payment.save();

    // Adjust Invoice totals
    invoice.amountPaid = Math.round((invoice.amountPaid + parsedAmount) * 100) / 100;
    invoice.amountDue = Math.round((invoice.totalAmount - invoice.amountPaid) * 100) / 100;

    // Update Status
    if (invoice.amountDue <= 0) {
      invoice.status = 'Paid';
    } else if (invoice.amountPaid > 0) {
      invoice.status = 'Partially Paid';
    }

    await invoice.save();

    // Send payment confirmation email to client (fire-and-forget, non-blocking)
    Client.findById(invoice.client).then(async (clientObj) => {
      if (!clientObj) return;
      const businessObj = await Business.findOne({ tenantId });
      sendPaymentConfirmationEmail(
        clientObj.email,
        clientObj.name,
        invoice,
        payment,
        businessObj || { name: 'BillHouse Partner' }
      ).catch((err: any) => console.error('❌ Payment confirmation email failed:', err));
    }).catch((err: any) => console.error('❌ Could not fetch client for confirmation email:', err));

    // Write audit log (fire-and-forget)
    logAudit({
      tenantId,
      userId: req.user!.id,
      userName: req.user!.name || 'User',
      action: AuditActions.PAYMENT_RECORDED,
      details: `Recorded ₹${parsedAmount} payment via ${method} for invoice ${invoice.number}${transactionId ? ` (Txn: ${transactionId})` : ''}`,
      ipAddress: req.ip
    });

    return res.status(201).json({
      message: 'Payment recorded successfully',
      payment,
      invoice
    });
  } catch (error) {
    console.error('❌ Create payment error:', error);
    return res.status(500).json({ error: 'Server error recording payment statement' });
  }
});

// 2. GET PAYMENT HISTORY FOR A SPECIFIC INVOICE (GET /invoice/:invoiceId)
router.get('/invoice/:invoiceId', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { tenantId } = req.user;
    const { invoiceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({ error: 'Invalid invoice ID format' });
    }

    // Check if invoice belongs to tenant
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    if (invoice.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Access denied to this tenant resource' });
    }

    // Find all payment history logs
    const payments = await Payment.find({ tenantId, invoice: invoiceId }).sort({ date: -1 });
    return res.status(200).json(payments);
  } catch (error) {
    console.error('❌ Get payments error:', error);
    return res.status(500).json({ error: 'Server error fetching payments history list' });
  }
});

// 3. DELETE / VOID A PAYMENT (DELETE /:id)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { tenantId } = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid payment ID format' });
    }

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }
    if (payment.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Access denied to this tenant resource' });
    }

    const invoice = await Invoice.findById(payment.invoice);
    if (!invoice) {
      return res.status(404).json({ error: 'Associated invoice not found' });
    }

    // Adjust Invoice balances
    invoice.amountPaid = Math.max(0, Math.round((invoice.amountPaid - payment.amount) * 100) / 100);
    invoice.amountDue = Math.round((invoice.totalAmount - invoice.amountPaid) * 100) / 100;

    // Adjust Status
    if (invoice.amountPaid === 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isOverdue = new Date(invoice.dueDate) < today;
      invoice.status = isOverdue ? 'Overdue' : 'Sent';
    } else if (invoice.amountDue > 0) {
      invoice.status = 'Partially Paid';
    } else {
      invoice.status = 'Paid';
    }

    await invoice.save();
    await Payment.findByIdAndDelete(id);

    // Write audit log (fire-and-forget)
    logAudit({
      tenantId,
      userId: req.user!.id,
      userName: req.user!.name || 'User',
      action: AuditActions.PAYMENT_VOIDED,
      details: `Voided ₹${payment.amount} payment (${payment.method}) for invoice ${invoice.number}`,
      ipAddress: req.ip
    });

    return res.status(200).json({
      message: 'Payment voided successfully',
      invoice
    });
  } catch (error) {
    console.error('❌ Delete payment error:', error);
    return res.status(500).json({ error: 'Server error voiding payment record' });
  }
});

export default router;
