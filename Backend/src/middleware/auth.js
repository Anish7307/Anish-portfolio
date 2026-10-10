import jwt from 'jsonwebtoken';
import { COOKIE_NAME, CLIENT_ORIGINS } from '../config.js';

export function requireAdmin(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ message: 'Please log in.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (payload.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });
    req.adminId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ message: 'Session expired. Please log in again.' });
  }
}

// CSRF defence for cookie auth: browsers always send Origin on cross-origin
// state-changing requests, so reject any whose Origin is not an allowed client.
export function checkOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin && !CLIENT_ORIGINS.includes(origin.replace(/\/$/, ''))) {
    return res.status(403).json({ message: 'Request origin not allowed.' });
  }
  next();
}
