import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { getRegistry } from './services/verificationService.js';
import app from './app.js';

const start = async () => {
  await connectDB();
  // Preload citizen registry into memory so first verification request is instant
  try {
    getRegistry();
  } catch (err) {
    console.warn('Warning: Could not preload registry at startup:', err.message);
  }
  app.listen(env.port, () => console.log(`NID Verify API running on http://localhost:${env.port} (${env.nodeEnv})`));
};

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));
