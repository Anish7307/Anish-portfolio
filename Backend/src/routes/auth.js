import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import Admin from '../models/Admin.js';
import { requireAdmin } from '../middleware/auth.js';
import { COOKIE_NAME, cookieOptions, baseCookieOptions } from '../config.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

// Only failed attempts count toward the limit, so a legitimate admin isn't locked out.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Try again later.' }
});

// Compared against when the email is unknown, so response time doesn't reveal
// whether an account exists.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const admin = await Admin.findOne({ email }).select('+passwordHash');
  const valid = await bcrypt.compare(password, admin?.passwordHash || DUMMY_HASH);
  if (!admin || !valid) return res.status(401).json({ message: 'Email or password is incorrect.' });
  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { subject: admin.id, expiresIn: '7d', algorithm: 'HS256' });
  res.cookie(COOKIE_NAME, token, cookieOptions());
  res.json({ email: admin.email });
}));

router.get('/me', requireAdmin, asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.adminId).select('email');
  if (!admin) return res.status(401).json({ message: 'Admin account not found.' });
  res.json({ email: admin.email });
}));

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, baseCookieOptions());
  res.json({ message: 'Logged out.' });
});

export default router;
