// Usage: npm run seed:admin
// Seeds admin user via the live API (backend must be running on port 5000).
// Falls back to direct DB if API is not available.
import '../config/env.js';

const { ADMIN_NAME = 'System Admin', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
const API_BASE = process.env.API_BASE || 'http://localhost:5000';

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first');
  process.exit(1);
}
if (ADMIN_PASSWORD.length < 8) {
  console.error('ADMIN_PASSWORD must be at least 8 characters');
  process.exit(1);
}

const seedViaApi = async () => {
  const { default: http } = await import('http');
  const email = ADMIN_EMAIL.trim().toLowerCase();

  const post = (path, body) => new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const opts = {
      hostname: 'localhost', port: 5000, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    };
    const req = http.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });

  // Try register
  const reg = await post('/api/auth/register', { name: ADMIN_NAME, email, password: ADMIN_PASSWORD });
  if (reg.status === 201) {
    console.log(`Admin ${email} registered via API. Now promoting to admin role...`);
    // Need to promote via DB since API doesn't expose role promotion
    await promoteViaDb(email);
  } else if (reg.body?.message?.includes('already')) {
    console.log(`User ${email} already exists. Ensuring admin role via DB...`);
    await promoteViaDb(email);
  } else {
    throw new Error(`API register failed: ${reg.status} ${JSON.stringify(reg.body)}`);
  }
};

const promoteViaDb = async (email) => {
  const { connectDB, closeDB } = await import('../config/db.js');
  const { default: User } = await import('../models/User.js');
  await connectDB();
  try {
    const user = await User.findOne({ email });
    if (!user) throw new Error(`User ${email} not found in DB`);
    if (user.role === 'admin') {
      console.log(`Admin ${email} already has admin role. Nothing to do.`);
    } else {
      user.role = 'admin';
      await user.save();
      console.log(`User ${email} promoted to admin.`);
    }
  } finally {
    await closeDB();
  }
};

seedViaApi().catch(err => { console.error('Seed failed:', err.message); process.exit(1); });
