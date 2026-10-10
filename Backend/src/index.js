import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import { UPLOADS_DIR, CLIENT_ORIGINS, isProd } from './config.js';
import Admin from './models/Admin.js';
import Profile from './models/Portfolio.js';
import authRoutes from './routes/auth.js';
import portfolioRoutes from './routes/portfolio.js';
import adminRoutes from './routes/admin.js';

const required = ['MONGODB_URI', 'JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}. Copy .env.example to .env and fill it in.`);
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 10) {
  console.error('JWT_SECRET must be at least 10 characters long.');
  process.exit(1);
}
if (process.env.ADMIN_PASSWORD.length < 8) {
  console.error('ADMIN_PASSWORD must be at least 8 characters long.');
  process.exit(1);
}

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet({
  // The frontend runs on another origin and loads images/PDFs from /uploads;
  // helmet's default "same-origin" policy would block them.
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
  origin: (origin, cb) => (!origin || CLIENT_ORIGINS.includes(origin) ? cb(null, true) : cb(null, false)),
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(morgan(isProd ? 'combined' : 'dev'));

app.use('/uploads', express.static(UPLOADS_DIR, { dotfiles: 'deny', index: false, maxAge: '1h', immutable: false }));

app.get('/api/health', (_req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({ status: dbUp ? 'ok' : 'degraded', db: dbUp ? 'connected' : 'disconnected' });
});

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many requests. Slow down.' } }));
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api', (_req, res) => res.status(404).json({ message: 'Route not found.' }));

// Central error handler. Known errors get a clear message; anything unexpected is
// logged with its stack and returned as a generic 500 (no more blanket 400s for TypeError).
app.use((err, req, res, _next) => {
  if (res.headersSent) return _next(err);
  if (err.expose && err.status) return res.status(err.status).json({ message: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON body.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Request body is too large.' });
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'File is too large. Maximum size is 5 MB.' });
    return res.status(400).json({ message: 'Invalid file upload.' });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid item ID.' });
  if (err.code === 11000) return res.status(409).json({ message: 'That value already exists.' });
  if (err.name === 'ValidationError') return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join(' ') });
  console.error(`${req.method} ${req.originalUrl}`, err);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

const seed = async () => {
  const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
  const admin = await Admin.findOne({ email }).select('+passwordHash');
  if (!admin) {
    await Admin.create({ email, passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12) });
  } else if (!(await bcrypt.compare(process.env.ADMIN_PASSWORD, admin.passwordHash))) {
    // Lets you rotate the admin password by changing .env and restarting.
    admin.passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    await admin.save();
  }
  if (!await Profile.exists({})) await Profile.create({});
};

let server;
const start = async () => {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  await seed();
  const port = process.env.PORT || 5000;
  server = app.listen(port, () => console.log(`Portfolio API running on port ${port}`));
};

const shutdown = signal => {
  console.log(`${signal} received, shutting down.`);
  const done = () => mongoose.connection.close().finally(() => process.exit(0));
  server ? server.close(done) : done();
  setTimeout(() => process.exit(1), 10000).unref();
};
['SIGINT', 'SIGTERM'].forEach(s => process.on(s, () => shutdown(s)));
process.on('unhandledRejection', err => console.error('Unhandled rejection:', err));

start().catch(err => { console.error('Could not start server:', err.message); process.exit(1); });
