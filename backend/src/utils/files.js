import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env.js';
import StoredFile from '../models/StoredFile.js';

// path.basename blocks any path traversal even if a DB value were tampered with.
export const storedPath = (filename) => path.join(env.uploadDir, path.basename(filename));

/**
 * Ensures a stored file exists on local disk. If absent (e.g. after container restart),
 * seamlessly pulls it from MongoDB permanent storage and restores it to disk.
 */
export const ensureFileOnDisk = async (filename) => {
  if (!filename) return null;
  const fullPath = storedPath(filename);
  try {
    await fs.access(fullPath);
    return fullPath;
  } catch {
    // Disk miss, restore from MongoDB
  }

  try {
    const stored = await StoredFile.findOne({ filename: path.basename(filename) });
    if (stored && stored.data) {
      await fs.mkdir(env.uploadDir, { recursive: true });
      await fs.writeFile(fullPath, stored.data);
      console.log(`[FILES] Restored ${filename} from MongoDB to local disk.`);
      return fullPath;
    }
  } catch (err) {
    console.warn(`[FILES] Failed to restore ${filename} from MongoDB:`, err.message);
  }
  return fullPath;
};

/**
 * Persists files uploaded to disk into MongoDB for permanent durability across container restarts.
 */
export const persistFilesToDb = async (files = []) => {
  const validFiles = files.filter(Boolean);
  await Promise.all(
    validFiles.map(async (file) => {
      try {
        const filePath = file.path || storedPath(file.filename);
        const data = await fs.readFile(filePath);
        await StoredFile.findOneAndUpdate(
          { filename: file.filename },
          {
            filename: file.filename,
            data,
            mimeType: file.mimetype || file.mimeType || 'image/jpeg',
            size: file.size || data.length,
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.warn(`[PERSIST] Failed to persist ${file.filename} to MongoDB:`, err.message);
      }
    })
  );
};

export const removeStoredFiles = async (filenames = []) => {
  const cleanNames = filenames.filter(Boolean).map((n) => path.basename(n));
  if (!cleanNames.length) return;

  await Promise.all([
    ...cleanNames.map(async (name) => {
      try {
        await fs.unlink(storedPath(name));
      } catch (err) {
        if (err.code !== 'ENOENT') console.error('File cleanup failed:', err.message);
      }
    }),
    StoredFile.deleteMany({ filename: { $in: cleanNames } }).catch((err) => {
      console.warn('MongoDB file cleanup warning:', err.message);
    }),
  ]);
};

/**
 * Streams a private file after the caller has already authorised access.
 * Checks local disk first; if absent (due to container restart), seamlessly falls back
 * to MongoDB permanent storage and restores the disk cache.
 */
export const sendPrivateFile = async (res, file) => {
  if (!file || !file.filename) return res.status(404).json({ message: 'File not found' });
  const fullPath = storedPath(file.filename);

  // 1. Try local disk cache first
  try {
    await fs.access(fullPath);
    return res.sendFile(fullPath, {
      cacheControl: false,
      etag: false,
      lastModified: false,
      headers: {
        'Content-Type': file.mimeType || 'image/jpeg',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': 'inline',
      },
    });
  } catch {
    // Disk cache miss — container may have restarted or been redeployed
  }

  // 2. Fallback to MongoDB permanent storage
  try {
    const stored = await StoredFile.findOne({ filename: file.filename });
    if (!stored || !stored.data) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Restore to disk cache in background
    fs.mkdir(env.uploadDir, { recursive: true })
      .then(() => fs.writeFile(fullPath, stored.data))
      .catch((err) => console.warn('Disk cache write warning:', err.message));

    res.setHeader('Content-Type', file.mimeType || stored.mimeType || 'image/jpeg');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'inline');
    return res.send(stored.data);
  } catch (err) {
    console.error('Error retrieving file from MongoDB:', err.message);
    return res.status(500).json({ message: 'Error retrieving file' });
  }
};

/**
 * Syncs any files currently present on local disk to MongoDB on server startup.
 */
export const syncExistingUploadsToDb = async () => {
  try {
    await fs.mkdir(env.uploadDir, { recursive: true });
    const diskFiles = await fs.readdir(env.uploadDir);
    const imageFiles = diskFiles.filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));
    if (!imageFiles.length) return;

    for (const filename of imageFiles) {
      const exists = await StoredFile.exists({ filename });
      if (!exists) {
        try {
          const filePath = path.join(env.uploadDir, filename);
          const data = await fs.readFile(filePath);
          const ext = path.extname(filename).toLowerCase();
          const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
          await StoredFile.create({
            filename,
            data,
            mimeType,
            size: data.length,
          });
          console.info(`[SYNC] Backed up ${filename} to MongoDB storage.`);
        } catch (readErr) {
          console.warn(`[SYNC] Failed to backup ${filename}:`, readErr.message);
        }
      }
    }
  } catch (err) {
    console.warn('[SYNC] Uploads sync warning:', err.message);
  }
};
