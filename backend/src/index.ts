import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import clientRoutes from './routes/clientRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import businessRoutes from './routes/businessRoutes';
import { authMiddleware } from './middleware/authMiddleware';
import dns from 'dns';

// Fix for DNS SRV resolution issues on certain ISPs (like Jio/Airtel in India)
// by setting the DNS servers to Google and Cloudflare DNS.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  console.warn('⚠️ Could not set custom DNS servers:', dnsErr);
}

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', authMiddleware, clientRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/invoices', authMiddleware, invoiceRoutes);
app.use('/api/business', authMiddleware, businessRoutes);

// Root route/Health check
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'BillHouse API',
    version: '1.0.0',
    timestamp: new Date()
  });
});

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('❌ MONGODB_URI environment variable is missing! Server cannot connect to database.');
  process.exit(1);
}

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`🚀 BillHouse Backend Server is running on http://localhost:${PORT}`);
    console.log(`👉 Accepting requests from: ${frontendUrl}`);
  });
};

console.log('🔌 Connecting to MongoDB...');
mongoose.connect(mongoUri)
  .then(() => {
    console.log('✅ MongoDB connected successfully.');
    startServer();
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    
    // Check if the URI is a cloud connection and try a local fallback
    if (mongoUri.startsWith('mongodb+srv://') || mongoUri.includes('mongodb.net')) {
      const localFallbackUri = 'mongodb://127.0.0.1:27017/billhouse';
      console.log(`🔌 Attempting fallback to local MongoDB instance: ${localFallbackUri}`);
      
      mongoose.connect(localFallbackUri)
        .then(() => {
          console.log('✅ Local MongoDB connected successfully as fallback.');
          startServer();
        })
        .catch((localErr) => {
          console.error('❌ Local MongoDB connection fallback failed:', localErr);
          console.log('⚠️ Could not start the server due to database connection failure.');
          process.exit(1);
        });
    } else {
      console.log('⚠️ Could not start the server due to database connection failure.');
      process.exit(1);
    }
  });
