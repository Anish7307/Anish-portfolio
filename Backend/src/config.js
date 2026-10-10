import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const isProd = process.env.NODE_ENV === 'production';

// Single source of truth for the uploads folder. Previously index.js (relative to the
// file) and upload.js (relative to process.cwd()) could point at different folders.
export const UPLOADS_DIR = path.resolve(__dirname, '../uploads');

// CLIENT_URL may hold several comma-separated origins.
export const CLIENT_ORIGINS = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

export const COOKIE_NAME = 'portfolio_token';

// Use COOKIE_SAMESITE=none when the frontend and API are on different sites
// (e.g. Vercel + Render). Requires HTTPS, so it is only valid in production.
const sameSite = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();

export const baseCookieOptions = () => ({
  httpOnly: true,
  secure: isProd || sameSite === 'none',
  sameSite,
  path: '/'
});

export const cookieOptions = () => ({ ...baseCookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000 });
