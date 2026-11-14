// List all databases and users collection to debug
import mongoose from 'mongoose';

const conn = await mongoose.createConnection('mongodb://127.0.0.1:27018/', { serverSelectionTimeoutMS: 5000 }).asPromise();
const admin = conn.db.admin();
const dbs = await admin.listDatabases();
console.log('Databases:', JSON.stringify(dbs.databases.map(d => d.name)));

for (const db of dbs.databases) {
  if (db.name === 'admin' || db.name === 'local' || db.name === 'config') continue;
  const dbConn = conn.useDb(db.name);
  const collections = await dbConn.db.listCollections().toArray();
  console.log(`\nDB: ${db.name}, Collections:`, collections.map(c => c.name));
  if (collections.find(c => c.name === 'users')) {
    const users = await dbConn.collection('users').find({}).toArray();
    console.log('Users:', users.map(u => ({ email: u.email, role: u.role })));
  }
}

await conn.close();
process.exit(0);
