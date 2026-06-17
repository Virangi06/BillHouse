import { Router, Response } from 'express';
import fs from 'fs';
import path from 'path';
import Business from '../models/Business';
import { AuthRequest } from '../middleware/authMiddleware';

// Helper function to decode and save base64 image data to local disk
function saveLogoToDisk(logoBase64: string, tenantId: string): string {
  if (!logoBase64 || !logoBase64.startsWith('data:image/')) {
    return logoBase64; // Return as-is if it's already a URL, empty, or not a base64 data uri
  }

  try {
    const matches = logoBase64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return logoBase64;
    }

    const extension = matches[1];
    const dataBuffer = Buffer.from(matches[2], 'base64');
    
    // Create unique filename based on tenant ID
    const filename = `logo-${tenantId}.${extension}`;
    const uploadsDir = path.join(__dirname, '../../uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, dataBuffer);

    console.log(`💾 Saved logo file to disk: ${filePath}`);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error('❌ Error saving logo file to disk:', err);
    return logoBase64;
  }
}

const router = Router();

// ─── GET BUSINESS PROFILE ───────────────────────────────────────────────────
// Returns null if no profile exists yet (first-time user)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { tenantId } = req.user;
    const business = await Business.findOne({ tenantId });

    // Return null profile (not 404) — frontend uses this to detect onboarding needed
    return res.status(200).json({ business: business || null });
  } catch (error) {
    console.error('❌ Get business profile error:', error);
    return res.status(500).json({ error: 'Server error retrieving business profile' });
  }
});

// ─── CREATE BUSINESS PROFILE (First-time onboarding) ─────────────────────────
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { tenantId } = req.user;

    // Prevent duplicate profiles
    const existing = await Business.findOne({ tenantId });
    if (existing) {
      return res.status(400).json({ error: 'Business profile already exists. Use PUT to update.' });
    }

    const {
      name, type, email, phone,
      legalName, website, industry,
      address, addressLine2, city, state, pincode, country,
      gstNumber, panNumber, taxRegistrationNumber,
      logoBase64, bannerBase64,
      invoicePrefix, invoiceNextNumber, currency, timeZone, invoiceNumberFormat,
      bankName, bankAccount, bankIfsc, bankUpi
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Business name is required' });
    }

    // Validate logo size (base64 ~1.37x actual bytes; cap at ~700KB encoded ≈ 500KB actual)
    if (logoBase64 && logoBase64.length > 700_000) {
      return res.status(400).json({ error: 'Logo image is too large. Please use an image under 500KB.' });
    }
    // Validate banner size
    if (bannerBase64 && bannerBase64.length > 2_000_000) {
      return res.status(400).json({ error: 'Banner image is too large. Please use an image under 1.5MB.' });
    }

    const logoDiskPath = logoBase64 ? saveLogoToDisk(logoBase64, tenantId) : '';

    const business = new Business({
      tenantId,
      name: name.trim(),
      type: type || 'freelancer',
      email: email?.trim().toLowerCase(),
      phone: phone?.trim(),
      legalName: legalName?.trim(),
      website: website?.trim(),
      industry: industry?.trim(),
      address: address?.trim(),
      addressLine2: addressLine2?.trim(),
      city: city?.trim(),
      state: state?.trim(),
      pincode: pincode?.trim(),
      country: country || 'India',
      gstNumber: gstNumber?.trim().toUpperCase(),
      panNumber: panNumber?.trim().toUpperCase(),
      taxRegistrationNumber: taxRegistrationNumber?.trim(),
      logoBase64: logoDiskPath,
      bannerBase64,
      invoicePrefix: invoicePrefix?.trim().toUpperCase() || 'INV',
      invoiceNextNumber: Math.max(1, parseInt(invoiceNextNumber) || 1),
      currency: currency || 'INR',
      timeZone: timeZone || 'Asia/Kolkata',
      invoiceNumberFormat: invoiceNumberFormat || '{prefix}-{number}',
      bankName: bankName?.trim(),
      bankAccount: bankAccount?.trim(),
      bankIfsc: bankIfsc?.trim().toUpperCase(),
      bankUpi: bankUpi?.trim()
    });

    await business.save();

    return res.status(201).json({
      message: 'Business profile created successfully',
      business
    });
  } catch (error) {
    console.error('❌ Create business profile error:', error);
    return res.status(500).json({ error: 'Server error creating business profile' });
  }
});

// ─── UPDATE BUSINESS PROFILE ─────────────────────────────────────────────────
router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { tenantId } = req.user;
    let business = await Business.findOne({ tenantId });

    if (!business) {
      return res.status(404).json({ error: 'Business profile not found. Create one first.' });
    }

    const {
      name, type, email, phone,
      legalName, website, industry,
      address, addressLine2, city, state, pincode, country,
      gstNumber, panNumber, taxRegistrationNumber,
      logoBase64, bannerBase64,
      invoicePrefix, invoiceNextNumber, currency, timeZone, invoiceNumberFormat,
      bankName, bankAccount, bankIfsc, bankUpi
    } = req.body;

    // Validate logo size
    if (logoBase64 && logoBase64.length > 700_000) {
      return res.status(400).json({ error: 'Logo image is too large. Please use an image under 500KB.' });
    }
    // Validate banner size
    if (bannerBase64 && bannerBase64.length > 2_000_000) {
      return res.status(400).json({ error: 'Banner image is too large. Please use an image under 1.5MB.' });
    }

    if (name !== undefined) business.name = name.trim();
    if (type !== undefined) business.type = type;
    if (email !== undefined) business.email = email.trim().toLowerCase();
    if (phone !== undefined) business.phone = phone.trim();
    if (legalName !== undefined) business.legalName = legalName.trim();
    if (website !== undefined) business.website = website.trim();
    if (industry !== undefined) business.industry = industry.trim();
    if (address !== undefined) business.address = address.trim();
    if (addressLine2 !== undefined) business.addressLine2 = addressLine2.trim();
    if (city !== undefined) business.city = city.trim();
    if (state !== undefined) business.state = state.trim();
    if (pincode !== undefined) business.pincode = pincode.trim();
    if (country !== undefined) business.country = country;
    if (gstNumber !== undefined) business.gstNumber = gstNumber.trim().toUpperCase();
    if (panNumber !== undefined) business.panNumber = panNumber.trim().toUpperCase();
    if (taxRegistrationNumber !== undefined) business.taxRegistrationNumber = taxRegistrationNumber.trim();
    if (logoBase64 !== undefined) business.logoBase64 = logoBase64 ? saveLogoToDisk(logoBase64, tenantId) : '';
    if (bannerBase64 !== undefined) business.bannerBase64 = bannerBase64;
    if (invoicePrefix !== undefined) business.invoicePrefix = invoicePrefix.trim().toUpperCase();
    if (invoiceNextNumber !== undefined) business.invoiceNextNumber = Math.max(1, parseInt(invoiceNextNumber) || 1);
    if (currency !== undefined) business.currency = currency;
    if (timeZone !== undefined) business.timeZone = timeZone;
    if (invoiceNumberFormat !== undefined) business.invoiceNumberFormat = invoiceNumberFormat;
    if (bankName !== undefined) business.bankName = bankName.trim();
    if (bankAccount !== undefined) business.bankAccount = bankAccount.trim();
    if (bankIfsc !== undefined) business.bankIfsc = bankIfsc.trim().toUpperCase();
    if (bankUpi !== undefined) business.bankUpi = bankUpi.trim();

    await business.save();

    return res.status(200).json({
      message: 'Business profile updated successfully',
      business
    });
  } catch (error) {
    console.error('❌ Update business profile error:', error);
    return res.status(500).json({ error: 'Server error updating business profile' });
  }
});

export default router;
