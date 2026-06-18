const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const uri = 'mongodb://127.0.0.1:27017/billhouse';
mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to DB');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password@123', salt);
    const res = await mongoose.connection.db.collection('users').updateOne(
      { email: 'test@gmail.com' },
      { $set: { passwordHash: passwordHash, isVerified: true } }
    );
    console.log('Password updated status:', res);
    mongoose.connection.close();
  })
  .catch(err => {
    console.error(err);
  });
