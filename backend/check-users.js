const mongoose = require('mongoose');

const uri = 'mongodb://127.0.0.1:27017/billhouse';
console.log('Connecting to local MongoDB:', uri);

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to DB');
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('Users found:', users.map(u => ({ email: u.email, isVerified: u.isVerified })));
    mongoose.connection.close();
  })
  .catch(err => {
    console.error(err);
  });
