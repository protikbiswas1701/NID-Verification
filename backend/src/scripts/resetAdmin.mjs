import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI = 'mongodb://127.0.0.1:27017/nid_verify';

async function resetAdmin() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const password = 'Admin123456!';
  const hash = await bcrypt.hash(password, 12);

  const result = await db.collection('users').updateOne(
    { email: 'admin@nidverify.local' },
    { $set: { password: hash } }
  );

  console.log('Documents matched:', result.matchedCount);
  console.log('Documents updated:', result.modifiedCount);

  // Verify the hash works
  const user = await db.collection('users').findOne({ email: 'admin@nidverify.local' });
  const match = await bcrypt.compare(password, user.password);
  console.log('bcrypt.compare test:', match ? '✅ PASS' : '❌ FAIL');

  await mongoose.disconnect();
}

resetAdmin().catch(console.error);
