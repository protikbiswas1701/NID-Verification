import fs from 'fs/promises';

// Detects the real image type from the first bytes ("magic numbers").
const detectType = (b) => {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (b.length >= 12 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  return null;
};

const readHead = async (filePath) => {
  const handle = await fs.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(12);
    const { bytesRead } = await handle.read(buffer, 0, 12, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
};

const discard = (files) => Promise.all(files.map((f) => fs.unlink(f.path).catch(() => {})));

// Runs after multer: requires a front image and verifies every file's real
// type matches its declared MIME type. Invalid uploads are deleted from disk.
export const validateSignatures = async (req, res, next) => {
  const files = Object.values(req.files || {}).flat();
  try {
    if (!req.files?.frontImage?.[0]) {
      await discard(files);
      return res.status(400).json({ message: 'Front image is required' });
    }
    for (const file of files) {
      const detected = detectType(await readHead(file.path));
      if (!detected || detected !== file.mimetype) {
        await discard(files);
        return res.status(400).json({ message: 'One of the files is not a valid image' });
      }
    }
    return next();
  } catch (err) {
    await discard(files);
    return next(err);
  }
};
