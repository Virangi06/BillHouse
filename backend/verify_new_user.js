const mongoose = require('mongoose');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  console.warn('⚠️ Could not set custom DNS servers:', dnsErr);
}

const mongoUri = 'mongodb://127.0.0.1:27017/billhouse';

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('✅ Connected to MongoDB.');
    const db = mongoose.connection.db;
    
    // Set isVerified: true for wizard@example.com
    const result = await db.collection('users').updateOne(
      { email: 'wizard@example.com' },
      { $set: { isVerified: true } }
    );
    
    if (result.matchedCount > 0) {
      console.log('⚡ Successfully verified wizard@example.com.');
    } else {
      console.log('⚠️ wizard@example.com not found in the database.');
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('❌ Connection error:', err);
    mongoose.connection.close();
  });
