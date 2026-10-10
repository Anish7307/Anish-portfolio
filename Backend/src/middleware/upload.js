import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { UPLOADS_DIR } from '../config.js';
import { HttpError } from '../utils/http.js';

// Files are held in memory, verified, and only then written to disk. This avoids
// orphaned files when validation fails after multer has already saved the upload.
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const TYPES = {
  'application/pdf': { ext: '.pdf', ok: b => b.subarray(0, 5).toString('latin1') === '%PDF-' },
  'image/jpeg': { ext: '.jpg', ok: b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { ext: '.png', ok: b => b.subarray(0, 8).equals(PNG_SIG) },
  'image/webp': { ext: '.webp', ok: b => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' }
};

const multerInstance = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 20 }
});

const label = types => types.map(t => TYPES[t].ext.slice(1).toUpperCase()).join(', ');

/**
 * Parses a single file field, validates its type by content (not just the
 * client-supplied mimetype), picks the extension itself, and saves it.
 * Sets req.file.url, e.g. "/uploads/<uuid>.pdf".
 */
export const uploadFile = (field = 'file', types = Object.keys(TYPES), { required = true } = {}) => [
  multerInstance.single(field),
  async (req, _res, next) => {
    try {
      if (!req.file) {
        if (required) throw new HttpError(400, 'Please select a file to upload.');
        return next();
      }
      const spec = TYPES[req.file.mimetype];
      if (!types.includes(req.file.mimetype) || !spec || !spec.ok(req.file.buffer)) {
        throw new HttpError(400, `Only ${label(types)} files are allowed.`);
      }
      await fs.mkdir(UPLOADS_DIR, { recursive: true });
      const filename = `${crypto.randomUUID()}${spec.ext}`;
      await fs.writeFile(path.join(UPLOADS_DIR, filename), req.file.buffer, { flag: 'wx' });
      req.file.filename = filename;
      req.file.url = `/uploads/${filename}`;
      req.file.buffer = undefined;
      next();
    } catch (err) { next(err); }
  }
];

/** Deletes a stored upload by its public URL. Never throws; ignores anything outside the uploads folder. */
export const removeUpload = async url => {
  if (typeof url !== 'string' || !url.startsWith('/uploads/')) return;
  const file = path.basename(url);
  const full = path.join(UPLOADS_DIR, file);
  if (path.dirname(full) !== UPLOADS_DIR) return;
  try { await fs.unlink(full); } catch (err) { if (err.code !== 'ENOENT') console.error('Could not delete upload:', err.message); }
};

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const PDF_TYPES = ['application/pdf'];
export const CERT_TYPES = ['application/pdf', ...IMAGE_TYPES];
