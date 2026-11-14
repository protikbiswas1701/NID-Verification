import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env.js';

// path.basename blocks any path traversal even if a DB value were tampered with.
export const storedPath = (filename) => path.join(env.uploadDir, path.basename(filename));

export const removeStoredFiles = async (filenames = []) => {
  await Promise.all(
    filenames.filter(Boolean).map(async (name) => {
      try {
        await fs.unlink(storedPath(name));
      } catch (err) {
        if (err.code !== 'ENOENT') console.error('File cleanup failed:', err.message);
      }
    })
  );
};

// Streams a private file after the caller has already authorised access.
export const sendPrivateFile = async (res, file) => {
  if (!file) return res.status(404).json({ message: 'File not found' });
  const fullPath = storedPath(file.filename);
  try {
    await fs.access(fullPath);
  } catch {
    return res.status(404).json({ message: 'File not found' });
  }
  return res.sendFile(fullPath, {
    cacheControl: false,
    etag: false,
    lastModified: false,
    headers: {
      'Content-Type': file.mimeType,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'inline',
    },
  });
};
