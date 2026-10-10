import { Router } from 'express';
import Profile from '../models/Portfolio.js';
import Project from '../models/Project.js';
import Certificate from '../models/Certificate.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  const [profile, projects, certificates] = await Promise.all([
    Profile.findOne().lean(),
    Project.find().sort({ featured: -1, createdAt: -1 }).lean(),
    Certificate.find().sort({ createdAt: -1 }).lean()
  ]);
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ profile, projects, certificates });
}));

export default router;
