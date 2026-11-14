import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import { env } from '../config/env.js';

fs.mkdirSync(env.uploadDir, { recursive: true });

const MIME_TO_EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.uploadDir),
  // Random server-side name; the extension comes from the MIME type, never from the client's filename.
  filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${MIME_TO_EXT[file.mimetype]}`),
});

const fileFilter = (_req, file, cb) => {
  if (MIME_TO_EXT[file.mimetype]) return cb(null, true);
  const err = new Error('Only JPG, JPEG, PNG and WEBP images are allowed');
  err.status = 400;
  return cb(err);
};

export const uploadNid = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.maxFileSizeMb * 1024 * 1024, files: 3, fields: 6 },
}).fields([
  { name: 'frontImage', maxCount: 1 },
  { name: 'backImage', maxCount: 1 },
  { name: 'selfieImage', maxCount: 1 },
]);

const zipStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.uploadDir),
  filename: (_req, file, cb) => cb(null, `batch_${Date.now()}_${crypto.randomUUID()}.zip`),
});

export const uploadZip = multer({
  storage: zipStorage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.includes('zip') || file.originalname.endsWith('.zip')) {
      return cb(null, true);
    }
    const err = new Error('Only ZIP files are supported for batch verification');
    err.status = 400;
    return cb(err);
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB batch ZIP limit
}).single('zipFile');
