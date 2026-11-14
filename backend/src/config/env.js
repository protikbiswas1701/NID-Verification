import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ quiet: true });

const required = ['MONGO_URI', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  console.error('Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  // Resolved relative to the folder you start the server from (backend/)
  uploadDir: path.resolve(process.env.UPLOAD_DIR || 'private_uploads'),
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB) || 5,
  aiServiceUrl: process.env.AI_SERVICE_URL || null,
};
