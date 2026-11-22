import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { getRegistry } from './services/verificationService.js';
import { syncExistingUploadsToDb } from './utils/files.js';
import app from './app.js';

const start = async () => {
  await connectDB();
  // Ensure any files currently on disk are backed up to persistent MongoDB
  try {
    await syncExistingUploadsToDb();
  } catch (syncErr) {
    console.warn('Uploads backup sync warning:', syncErr.message);
  }

  // Preload citizen registry into memory so first verification request is instant
  try {
    getRegistry();
  } catch (err) {
    console.warn('Warning: Could not preload registry at startup:', err.message);
  }

  // Ensure default admin user has admin privileges
  try {
    const User = (await import('./models/User.js')).default;
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@nidverify.local').trim().toLowerCase();
    const adminUser = await User.findOne({ email: adminEmail });
    if (adminUser && adminUser.role !== 'admin') {
      adminUser.role = 'admin';
      await adminUser.save();
      console.log(`Promoted ${adminEmail} to admin privileges.`);
    }
  } catch (seedErr) {
    console.warn('Admin privileges bootstrap warning:', seedErr.message);
  }

  app.listen(env.port, () => console.log(`NID Verify API running on http://localhost:${env.port} (${env.nodeEnv})`));
};

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));
