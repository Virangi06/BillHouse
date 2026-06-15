import { Router, Response } from 'express';
import Invoice from '../models/Invoice';
import Client from '../models/Client';
import Business from '../models/Business';
import { AuthRequest } from '../middleware/authMiddleware';
import mongoose from 'mongoose';

const router = Router();

// Helper to check if tenant owns this invoice
const verifyInvoiceAccess = async (invoiceId: string, tenantId: string) => {
  if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
    return { error: 'Invalid invoice ID format', status: 400 };
  }
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    return { error: 'Invoice not found', status: 404 };
  }
  if (invoice.tenantId !== tenantId) {
    return { error: 'Access denied to this tenant resource', status: 403 };
  }
  return { invoice };
};

// 1. GET ALL INVOICES FOR TENANT
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { tenantId } = req.user;
    const { status, search } = req.query;

    const query: any = { tenantId };

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { number: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } }
      ];
    }

    const invoices = await Invoice.find(query).sort({ date: -1 });
    return res.status(200).json(invoices);
  } catch (error) {
    console.error('❌ Get invoices error:', error);
    return res.status(500).json({ error: 'Server error retrieving invoices list' });
  }
});

// 2. GET SINGLE INVOICE BY ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { tenantId } = req.user;

    const access = await verifyInvoiceAccess(id, tenantId);
    if ('error' in access) {
      return res.status(access.status || 500).json({ error: access.error });
    }

    return res.status(200).json(access.invoice);
  } catch (error) {
    console.error('❌ Get invoice error:', error);
    return res.status(500).json({ error: 'Server error retrieving invoice details' });
  }
});

// 3. CREATE NEW INVOICE (With GST & Auto-Numbering)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { tenantId, id: userId } = req.user;
    const {
      clientId,
      date,
      dueDate,
      discountAmount,
      notes,
      terms,
      items,
      status
    } = req.body;

    if (!clientId || !dueDate || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Client, due date, and at least one line item are required' });
    }

    // 1. Verify client belongs to this tenant
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID format' });
    }
    const clientObj = await Client.findById(clientId);
    if (!clientObj || clientObj.tenantId !== tenantId) {
      return res.status(400).json({ error: 'Invalid client selected' });
    }

    // 2. Generate sequential invoice number using the business prefix
    // Fetch business profile to get prefix; fall back to 'INV' if not set up yet
    const businessProfile = await Business.findOne({ tenantId });
    const prefix = businessProfile?.invoicePrefix || 'INV';

    // Count total invoices for this tenant and determine next number
    const latestInvoice = await Invoice.findOne({ tenantId })
      .sort({ createdAt: -1 })
      .exec();

    let nextNum = (businessProfile?.invoiceNextNumber) || 1;
    if (latestInvoice && latestInvoice.number) {
      // Parse from the existing latest invoice number to avoid collisions
      const match = latestInvoice.number.match(/-?(\d+)$/);
      if (match) {
        const parsed = parseInt(match[1], 10) + 1;
        if (parsed > nextNum) nextNum = parsed;
      }
    }
    const number = `${prefix}-${String(nextNum).padStart(6, '0')}`;

    // 3. Perform calculations
    let subtotal = 0;
    let gstAmount = 0;

    const processedItems = items.map((item: any) => {
      const quantity = Math.max(1, parseFloat(item.quantity) || 1);
      const rate = Math.max(0, parseFloat(item.rate) || 0);
      const gstRate = Math.max(0, parseFloat(item.gstRate) || 0);
      
      const amount = quantity * rate;
      const itemGst = amount * (gstRate / 100);

      subtotal += amount;
      gstAmount += itemGst;

      return {
        description: item.description || 'Line Item',
        quantity,
        rate,
        gstRate,
        amount
      };
    });

    const discount = Math.max(0, parseFloat(discountAmount) || 0);
    const totalAmount = subtotal + gstAmount - discount;

    const initialStatus = status || 'Draft';
    const amountPaid = initialStatus === 'Paid' ? totalAmount : 0;
    const amountDue = totalAmount - amountPaid;

    const invoice = new Invoice({
      number,
      tenantId,
      client: clientId,
      clientName: clientObj.name,
      date: date ? new Date(date) : new Date(),
      dueDate: new Date(dueDate),
      status: initialStatus,
      subtotal,
      gstAmount,
      discountAmount: discount,
      totalAmount,
      amountPaid,
      amountDue,
      notes,
      terms,
      currency: 'INR',
      items: processedItems,
      createdBy: new mongoose.Types.ObjectId(userId),
      sentAt: initialStatus === 'Sent' ? new Date() : undefined,
      paidAt: initialStatus === 'Paid' ? new Date() : undefined
    });

    await invoice.save();

    return res.status(201).json({
      message: 'Invoice created successfully',
      invoice
    });
  } catch (error) {
    console.error('❌ Create invoice error:', error);
    return res.status(500).json({ error: 'Server error creating invoice record' });
  }
});

// 4. UPDATE INVOICE
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { tenantId } = req.user;
    const {
      clientId,
      date,
      dueDate,
      discountAmount,
      notes,
      terms,
      items,
      status
    } = req.body;

    const access = await verifyInvoiceAccess(id, tenantId);
    if ('error' in access) {
      return res.status(access.status || 500).json({ error: access.error });
    }

    const { invoice } = access;

    // Verify client if changed
    if (clientId && clientId !== invoice.client.toString()) {
      if (!mongoose.Types.ObjectId.isValid(clientId)) {
        return res.status(400).json({ error: 'Invalid client ID format' });
      }
      const clientObj = await Client.findById(clientId);
      if (!clientObj || clientObj.tenantId !== tenantId) {
        return res.status(400).json({ error: 'Invalid client selected' });
      }
      invoice.client = new mongoose.Types.ObjectId(clientId);
      invoice.clientName = clientObj.name;
    }

    if (date) invoice.date = new Date(date);
    if (dueDate) invoice.dueDate = new Date(dueDate);
    if (notes !== undefined) invoice.notes = notes;
    if (terms !== undefined) invoice.terms = terms;

    // Update items and recalculate if provided
    if (items && Array.isArray(items)) {
      let subtotal = 0;
      let gstAmount = 0;

      const processedItems = items.map((item: any) => {
        const quantity = Math.max(1, parseFloat(item.quantity) || 1);
        const rate = Math.max(0, parseFloat(item.rate) || 0);
        const gstRate = Math.max(0, parseFloat(item.gstRate) || 0);
        
        const amount = quantity * rate;
        const itemGst = amount * (gstRate / 100);

        subtotal += amount;
        gstAmount += itemGst;

        return {
          description: item.description || 'Line Item',
          quantity,
          rate,
          gstRate,
          amount
        };
      });

      invoice.items = processedItems as any;
      invoice.subtotal = subtotal;
      invoice.gstAmount = gstAmount;
    }

    if (discountAmount !== undefined) {
      invoice.discountAmount = Math.max(0, parseFloat(discountAmount) || 0);
    }

    invoice.totalAmount = invoice.subtotal + invoice.gstAmount - invoice.discountAmount;

    // Apply status and payment balances
    if (status) {
      invoice.status = status;
      if (status === 'Paid') {
        invoice.amountPaid = invoice.totalAmount;
        invoice.amountDue = 0;
        if (!invoice.paidAt) invoice.paidAt = new Date();
      } else {
        invoice.amountPaid = 0;
        invoice.amountDue = invoice.totalAmount;
        invoice.paidAt = undefined;
      }

      if (status === 'Sent' && !invoice.sentAt) {
        invoice.sentAt = new Date();
      }
    } else {
      // Keep alignment
      if (invoice.status === 'Paid') {
        invoice.amountPaid = invoice.totalAmount;
        invoice.amountDue = 0;
      } else {
        invoice.amountPaid = 0;
        invoice.amountDue = invoice.totalAmount;
      }
    }

    await invoice.save();

    return res.status(200).json({
      message: 'Invoice updated successfully',
      invoice
    });
  } catch (error) {
    console.error('❌ Update invoice error:', error);
    return res.status(500).json({ error: 'Server error updating invoice record' });
  }
});

// 5. STATUS PATCH UPDATE
router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { status } = req.body;
    const { tenantId } = req.user;

    const validStatuses = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid invoice status supplied' });
    }

    const access = await verifyInvoiceAccess(id, tenantId);
    if ('error' in access) {
      return res.status(access.status || 500).json({ error: access.error });
    }

    const { invoice } = access;
    invoice.status = status as any;

    if (status === 'Paid') {
      invoice.amountPaid = invoice.totalAmount;
      invoice.amountDue = 0;
      invoice.paidAt = new Date();
    } else {
      invoice.amountPaid = 0;
      invoice.amountDue = invoice.totalAmount;
      invoice.paidAt = undefined;
    }

    if (status === 'Sent') {
      invoice.sentAt = new Date();
    }

    await invoice.save();

    return res.status(200).json({
      message: `Invoice status updated to ${status} successfully`,
      invoice
    });
  } catch (error) {
    console.error('❌ Status patch error:', error);
    return res.status(500).json({ error: 'Server error updating invoice status' });
  }
});

// 6. DELETE INVOICE
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { tenantId } = req.user;

    const access = await verifyInvoiceAccess(id, tenantId);
    if ('error' in access) {
      return res.status(access.status || 500).json({ error: access.error });
    }

    const { invoice } = access;

    // Prevent deletion of Paid invoices
    if (invoice.status === 'Paid') {
      return res.status(400).json({ error: 'Paid invoices cannot be deleted' });
    }

    await Invoice.findByIdAndDelete(id);

    return res.status(200).json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('❌ Delete invoice error:', error);
    return res.status(500).json({ error: 'Server error deleting invoice record' });
  }
});

export default router;
