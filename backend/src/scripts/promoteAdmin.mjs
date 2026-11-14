// Promote admin in the 'test' db (current active DB), then also insert into nid_verify
import mongoose from 'mongoose';

// Promote in 'test' (where user currently is)
const conn = await mongoose.createConnection('mongodb://127.0.0.1:27018/test', { serverSelectionTimeoutMS: 5000 }).asPromise();
const User = conn.collection('users');
const result = await User.updateOne(
  { email: 'admin@nidverify.local' },
  { $set: { role: 'admin' } }
);
console.log('Updated in test db:', result.modifiedCount, 'doc(s)');

// Also copy to nid_verify db for when server restarts with correct URI
const nidConn = conn.useDb('nid_verify');
const nidUser = nidConn.collection('users');
const existing = await nidUser.findOne({ email: 'admin@nidverify.local' });
if (!existing) {
  const user = await User.findOne({ email: 'admin@nidverify.local' });
  await nidUser.insertOne({ ...user, _id: new mongoose.Types.ObjectId(), role: 'admin' });
  console.log('Copied admin to nid_verify db with admin role');
} else {
  await nidUser.updateOne({ email: 'admin@nidverify.local' }, { $set: { role: 'admin' } });
  console.log('Updated admin role in nid_verify db');
}

await conn.close();
console.log('Done.');
process.exit(0);
