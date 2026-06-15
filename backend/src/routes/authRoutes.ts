import { Router, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import User from '../models/User';
import { sendVerificationEmail, sendResetPasswordEmail } from '../services/emailService';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// Helper to generate JWT
const generateToken = (userId: string, tenantId: string): string => {
  const secret = process.env.JWT_SECRET || 'billhouse_jwt_secret_dev_key_2026_modern_invoice';
  return jwt.sign({ id: userId, tenantId }, secret, { expiresIn: '7d' });
};

// 1. SIGN UP
router.post('/signup', async (req: any, res: any) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate unique tenant ID for this user
    // In multi-tenancy, they are the root of a new tenant
    const tenantId = crypto.randomUUID();

    // Hashing password
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(password, salt);

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = new User({
      name,
      email: email.toLowerCase(),
      passwordHash,
      tenantId,
      isVerified: false,
      verificationToken,
      verificationTokenExpires
    });

    await user.save();

    // Send verification email (asynchronous, do not block response)
    sendVerificationEmail(user.email, user.name, verificationToken).catch((err) => {
      console.error('❌ Failed to send verification email during signup:', err);
    });

    return res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
      userId: user._id
    });
  } catch (error: any) {
    console.error('❌ Signup error:', error);
    return res.status(500).json({ error: 'Server error during registration' });
  }
});

// 2. VERIFY EMAIL
router.post('/verify-email', async (req: any, res: any) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    return res.status(200).json({ message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    console.error('❌ Verify email error:', error);
    return res.status(500).json({ error: 'Server error during email verification' });
  }
});

// 3. LOGIN
router.post('/login', async (req: any, res: any) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Require email verification to access dashboard
    if (!user.isVerified) {
      return res.status(403).json({ 
        error: 'Please verify your email address before logging in.',
        isNotVerified: true 
      });
    }

    const token = generateToken(user._id.toString(), user.tenantId);

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

// 4. FORGOT PASSWORD
router.post('/forgot-password', async (req: any, res: any) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Privacy note: we return a success status even if the email doesn't exist
    // to prevent email enumeration, but we only send the email if the user is found.
    if (!user) {
      return res.status(200).json({ 
        message: 'If that email is registered, we have sent a password reset link.' 
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // Send reset email (async)
    sendResetPasswordEmail(user.email, user.name, resetToken).catch((err) => {
      console.error('❌ Failed to send reset email:', err);
    });

    return res.status(200).json({ 
      message: 'If that email is registered, we have sent a password reset link.' 
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    return res.status(500).json({ error: 'Server error during forgot password' });
  }
});

// 5. RESET PASSWORD
router.post('/reset-password', async (req: any, res: any) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const salt = await bcryptjs.genSalt(10);
    user.passwordHash = await bcryptjs.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ message: 'Password has been reset successfully! You can now log in.' });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    return res.status(500).json({ error: 'Server error during password reset' });
  }
});

// 6. GET CURRENT USER (PROTECTED)
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('❌ Get user error:', error);
    return res.status(500).json({ error: 'Server error fetching user details' });
  }
});

export default router;
