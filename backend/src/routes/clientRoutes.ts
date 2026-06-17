import { Router, Response } from 'express';
import Client from '../models/Client';
import Invoice from '../models/Invoice';
import { AuthRequest } from '../middleware/authMiddleware';
import mongoose from 'mongoose';

const router = Router();

// Helper to check if user has access to a specific client record
const verifyTenantAccess = async (clientId: string, tenantId: string) => {
  if (!mongoose.Types.ObjectId.isValid(clientId)) {
    return { error: 'Invalid client ID format', status: 400 };
  }
  const client = await Client.findById(clientId);
  if (!client) return { error: 'Client not found', status: 404 };
  if (client.tenantId !== tenantId) return { error: 'Access denied to this tenant resource', status: 403 };
  return { client };
};

// 1. GET ALL CLIENTS (with optional sort & country filter)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { tenantId } = req.user;
    const { sortBy, country, archived } = req.query;

    const query: any = { tenantId };
    if (archived === 'true') {
      query.isArchived = true;
    } else {
      query.isArchived = { $ne: true };
    }
    if (country && typeof country === 'string' && country !== 'All') {
      query.country = country;
    }

    // Determine sort order
    let sortObj: any = { name: 1 }; // default sort by name asc
    if (sortBy === 'date') sortObj = { createdAt: -1 };

    const clients = await Client.find(query).sort(sortObj);
    return res.status(200).json(clients);
  } catch (error) {
    console.error('❌ Get clients error:', error);
    return res.status(500).json({ error: 'Server error retrieving clients list' });
  }
});

// 2. GET ALL CLIENTS WITH FINANCIAL AGGREGATION (single query — powers the clients table financial columns)
router.get('/with-financials', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { tenantId } = req.user;
    const { sortBy, country, archived } = req.query;

    // MongoDB aggregation: join clients with their invoices and compute totals
    const matchStage: any = { tenantId };
    if (archived === 'true') {
      matchStage.isArchived = true;
    } else {
      matchStage.isArchived = { $ne: true };
    }
    if (country && typeof country === 'string' && country !== 'All') {
      matchStage.country = country;
    }

    const pipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'invoices',
          let: { clientId: '$_id', tenantId: '$tenantId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$client', '$$clientId'] },
                    { $eq: ['$tenantId', '$$tenantId'] }
                  ]
                }
              }
            }
          ],
          as: 'invoices'
        }
      },
      {
        $addFields: {
          totalBilled: { $sum: '$invoices.totalAmount' },
          totalPaid: { $sum: '$invoices.amountPaid' },
          totalOutstanding: { $sum: '$invoices.amountDue' },
          invoiceCount: { $size: '$invoices' }
        }
      },
      {
        $project: {
          invoices: 0  // exclude raw invoices array from the list response
        }
      }
    ];

    // Apply sort
    if (sortBy === 'outstanding') {
      pipeline.push({ $sort: { totalOutstanding: -1 } });
    } else if (sortBy === 'date') {
      pipeline.push({ $sort: { createdAt: -1 } });
    } else {
      pipeline.push({ $sort: { name: 1 } });
    }

    const clients = await Client.aggregate(pipeline);
    return res.status(200).json(clients);
  } catch (error) {
    console.error('❌ Get clients with financials error:', error);
    return res.status(500).json({ error: 'Server error retrieving clients with financial data' });
  }
});

// 3. GET SINGLE CLIENT WITH FINANCIAL SUMMARY + INVOICE HISTORY (Client Detail Page)
router.get('/:id/summary', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { tenantId } = req.user;

    const access = await verifyTenantAccess(id, tenantId);
    if ('error' in access) {
      return res.status(access.status || 500).json({ error: access.error });
    }

    const { client } = access;

    // Fetch all invoices for this client (tenant scoped)
    const invoices = await Invoice.find({
      tenantId,
      client: new mongoose.Types.ObjectId(id)
    }).sort({ date: -1 });

    // Compute financial aggregates
    const totalBilled = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
    const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.amountDue || 0), 0);
    const paidCount = invoices.filter(inv => inv.status === 'Paid').length;
    const overdueCount = invoices.filter(inv => inv.status === 'Overdue').length;

    return res.status(200).json({
      client,
      financials: {
        totalBilled,
        totalPaid,
        totalOutstanding,
        invoiceCount: invoices.length,
        paidCount,
        overdueCount
      },
      invoices
    });
  } catch (error) {
    console.error('❌ Get client summary error:', error);
    return res.status(500).json({ error: 'Server error retrieving client summary' });
  }
});

// 4. GET SINGLE CLIENT BY ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { tenantId } = req.user;

    const access = await verifyTenantAccess(id, tenantId);
    if ('error' in access) {
      return res.status(access.status || 500).json({ error: access.error });
    }

    return res.status(200).json(access.client);
  } catch (error) {
    console.error('❌ Get client by id error:', error);
    return res.status(500).json({ error: 'Server error retrieving client details' });
  }
});

// 5. CREATE NEW CLIENT
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, companyName, email, phone, address, country, taxId, gstNumber, notes } = req.body;
    const { id: userId, tenantId } = req.user;

    if (!name || !email) {
      return res.status(400).json({ error: 'Client name and email are required' });
    }

    const client = new Client({
      name,
      companyName,
      email: email.toLowerCase(),
      phone,
      address,
      country: country || 'India',
      taxId,
      gstNumber: gstNumber ? gstNumber.toUpperCase() : undefined,
      notes,
      tenantId,
      createdBy: userId
    });

    await client.save();

    return res.status(201).json({
      message: 'Client created successfully',
      client
    });
  } catch (error) {
    console.error('❌ Create client error:', error);
    return res.status(500).json({ error: 'Server error creating client record' });
  }
});

// 6. UPDATE CLIENT
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { tenantId } = req.user;
    const { name, companyName, email, phone, address, country, taxId, gstNumber, notes, isArchived } = req.body;

    const access = await verifyTenantAccess(id, tenantId);
    if ('error' in access) {
      return res.status(access.status || 500).json({ error: access.error });
    }

    const { client } = access;
    if (name) client.name = name;
    if (companyName !== undefined) client.companyName = companyName;
    if (email) client.email = email.toLowerCase();
    if (phone !== undefined) client.phone = phone;
    if (address !== undefined) client.address = address;
    if (country !== undefined) client.country = country;
    if (taxId !== undefined) client.taxId = taxId;
    if (gstNumber !== undefined) client.gstNumber = gstNumber ? gstNumber.toUpperCase() : '';
    if (notes !== undefined) client.notes = notes;
    if (isArchived !== undefined) client.isArchived = isArchived;

    await client.save();

    return res.status(200).json({
      message: 'Client updated successfully',
      client
    });
  } catch (error) {
    console.error('❌ Update client error:', error);
    return res.status(500).json({ error: 'Server error updating client record' });
  }
});

// 7. DELETE CLIENT
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { tenantId } = req.user;

    const access = await verifyTenantAccess(id, tenantId);
    if ('error' in access) {
      return res.status(access.status || 500).json({ error: access.error });
    }

    // Soft-delete: set isArchived to true
    const { client } = access;
    client.isArchived = true;
    await client.save();

    return res.status(200).json({ message: 'Client archived successfully' });
  } catch (error) {
    console.error('❌ Delete client error:', error);
    return res.status(500).json({ error: 'Server error deleting client record' });
  }
});

export default router;
