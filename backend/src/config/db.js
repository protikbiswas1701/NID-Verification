import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { env } from './env.js';

let memoryServer = null;
let keepAliveInterval = null;

export const connectDB = async () => {
  try {
    // Try connecting to configured MongoDB (e.g. localhost:27017)
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 2000 });
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    console.warn('External MongoDB not reachable at', env.mongoUri);
    console.log('Starting persistent Embedded MongoDB server...');

    // Use a directory outside OneDrive to avoid file-locking issues
    const dbDir = path.join(process.env.TEMP || 'C:\\Temp', 'nid_verify_mongo');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    console.log('MongoDB data dir:', dbDir);

    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'nid_verify',
        dbPath: dbDir,
        storageEngine: 'wiredTiger',
        port: 27018, // fixed port so it's predictable
      },
    });
    const memoryUri = memoryServer.getUri('nid_verify');
    await mongoose.connect(memoryUri);
    console.log(`Persistent Embedded MongoDB active at: ${memoryUri}`);

    // Keepalive ping every 20 seconds to prevent idle shutdown
    keepAliveInterval = setInterval(async () => {
      try {
        await mongoose.connection.db.admin().ping();
      } catch (e) {
        console.warn('MongoDB keepalive ping failed:', e.message);
      }
    }, 20000);
  }
};

export const closeDB = async () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
};
