import { Router, Response } from 'express';
import Client from '../models/Client';
import { AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// Helper to check if user has access to a specific client record
const verifyTenantAccess = async (clientId: string, tenantId: string) => {
  const client = await Client.findById(clientId);
  if (!client) return { error: 'Client not found', status: 404 };
  if (client.tenantId !== tenantId) return { error: 'Access denied to this tenant resource', status: 403 };
  return { client };
};

// 1. GET ALL CLIENTS
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { tenantId } = req.user;
    const clients = await Client.find({ tenantId }).sort({ name: 1 });
    
    return res.status(200).json(clients);
  } catch (error) {
    console.error('❌ Get clients error:', error);
    return res.status(500).json({ error: 'Server error retrieving clients list' });
  }
});

// 2. GET SINGLE CLIENT BY ID
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

// 3. CREATE NEW CLIENT
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, email, phone, address, taxId } = req.body;
    const { id: userId, tenantId } = req.user;

    if (!name || !email) {
      return res.status(400).json({ error: 'Client name and email are required' });
    }

    const client = new Client({
      name,
      email: email.toLowerCase(),
      phone,
      address,
      taxId,
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

// 4. UPDATE CLIENT
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { tenantId } = req.user;
    const { name, email, phone, address, taxId } = req.body;

    const access = await verifyTenantAccess(id, tenantId);
    if ('error' in access) {
      return res.status(access.status || 500).json({ error: access.error });
    }

    const { client } = access;
    if (name) client.name = name;
    if (email) client.email = email.toLowerCase();
    if (phone !== undefined) client.phone = phone;
    if (address !== undefined) client.address = address;
    if (taxId !== undefined) client.taxId = taxId;

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

// 5. DELETE CLIENT
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

    // Delete the client document
    await Client.findByIdAndDelete(id);

    return res.status(200).json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('❌ Delete client error:', error);
    return res.status(500).json({ error: 'Server error deleting client record' });
  }
});

export default router;
