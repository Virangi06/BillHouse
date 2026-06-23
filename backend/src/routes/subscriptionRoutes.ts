import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Business from '../models/Business';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { logAudit, AuditActions } from '../services/auditService';

const router = Router();

// Initialize Razorpay instance (using mock checks if keys are placeholders or missing)
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
const isMockMode = !keyId || !keySecret || keyId.startsWith('your_') || keySecret.startsWith('your_');

let razorpay: Razorpay | null = null;
if (!isMockMode) {
  try {
    razorpay = new Razorpay({
      key_id: keyId!,
      key_secret: keySecret!
    });
    console.log('💳 Subscription System: Loaded Razorpay Payment Gateway');
  } catch (err) {
    console.error('❌ Failed to initialize Razorpay SDK. Falling back to Mock Mode.', err);
    razorpay = null;
  }
} else {
  console.log('💳 Subscription System: Razorpay keys are missing/mock. Running in MOCK CHECKOUT MODE.');
}

// 1. CREATE RAZORPAY ORDER FOR UPGRADE
router.post('/razorpay/create-order', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { planType } = req.body; // 'monthly' | 'annual'
    if (!planType || (planType !== 'monthly' && planType !== 'annual')) {
      return res.status(400).json({ error: 'Valid planType ("monthly" or "annual") is required.' });
    }

    const amount = planType === 'monthly' ? 29900 : 249900; // in paise
    const currency = 'INR';

    // Check if business profile exists
    const business = await Business.findOne({ tenantId: req.user.tenantId });
    if (!business) {
      return res.status(400).json({ error: 'Please set up your business profile first.' });
    }

    if (!isMockMode && razorpay) {
      const options = {
        amount,
        currency,
        receipt: `sub_receipt_${req.user.tenantId}_${Date.now()}`,
        notes: {
          tenantId: req.user.tenantId,
          planType,
          userId: req.user.id
        }
      };

      const order = await razorpay.orders.create(options);
      return res.status(200).json({
        isMock: false,
        key_id: keyId,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        planType
      });
    } else {
      // Mock Order creation
      const mockOrderId = `order_mock_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      return res.status(200).json({
        isMock: true,
        key_id: 'rzp_test_mock_keys',
        order_id: mockOrderId,
        amount,
        currency,
        planType
      });
    }
  } catch (error) {
    console.error('❌ Create Razorpay order error:', error);
    return res.status(500).json({ error: 'Failed to create payment order.' });
  }
});

// 2. VERIFY RAZORPAY SUBSCRIPTION PAYMENT
router.post('/razorpay/verify-payment', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { tenantId, id: userId } = req.user;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planType, isMockBypass } = req.body;

    if (!planType || (planType !== 'monthly' && planType !== 'annual')) {
      return res.status(400).json({ error: 'Valid planType ("monthly" or "annual") is required.' });
    }

    let isVerified = false;

    if (!isMockMode && !isMockBypass && razorpay_signature) {
      // Real Verification
      const generated_signature = crypto
        .createHmac('sha256', keySecret!)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      isVerified = generated_signature === razorpay_signature;
    } else {
      // Mock Verification bypass (allowed if key secret is mock/missing or explicitly flagged)
      isVerified = true;
    }

    if (!isVerified) {
      return res.status(400).json({ error: 'Payment signature verification failed. Transaction voided.' });
    }

    // Find and update business
    const business = await Business.findOne({ tenantId });
    if (!business) {
      return res.status(404).json({ error: 'Business profile not found.' });
    }

    // Calculate expiry date
    const expiresAt = new Date();
    if (planType === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    business.isPro = true;
    business.subscriptionPlan = planType;
    business.subscriptionExpiresAt = expiresAt;
    await business.save();

    // Log audit trail
    logAudit({
      tenantId,
      userId,
      userName: req.user.name || 'User',
      action: AuditActions.BUSINESS_UPDATED,
      details: `Upgraded business to Pro Plan (${planType}) - Subscription expires ${expiresAt.toLocaleDateString()}`,
      ipAddress: req.ip
    });

    return res.status(200).json({
      message: 'Subscription payment successfully verified! Pro Plan unlocked.',
      business
    });
  } catch (error) {
    console.error('❌ Verify Razorpay payment error:', error);
    return res.status(500).json({ error: 'Failed to verify subscription payment.' });
  }
});

export default router;
