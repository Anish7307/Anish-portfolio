import { Router } from 'express';
import Profile from '../models/Portfolio.js';
import Project from '../models/Project.js';
import Certificate from '../models/Certificate.js';
import { requireAdmin, checkOrigin } from '../middleware/auth.js';
import { uploadFile, removeUpload, IMAGE_TYPES, PDF_TYPES, CERT_TYPES } from '../middleware/upload.js';
import { HttpError, asyncHandler, pick, cleanString, cleanUrl, cleanList, cleanBool, cleanEmail } from '../utils/http.js';

const router = Router();
router.use(requireAdmin, checkOrigin);

// Removes a freshly saved upload if the request fails afterwards.
const discardOnError = (handler) => asyncHandler(async (req, res, next) => {
  try { await handler(req, res, next); }
  catch (err) { if (req.file?.url) await removeUpload(req.file.url); throw err; }
});

/* ---------- Profile ---------- */

router.put('/profile', asyncHandler(async (req, res) => {
  const body = pick(req.body, ['name', 'headline', 'about', 'location', 'email', 'skills', 'github', 'linkedin', 'photoUrl']);
  const update = {};
  if ('name' in body) update.name = cleanString(body.name, { max: 100, required: true, label: 'Name' });
  if ('headline' in body) update.headline = cleanString(body.headline, { max: 150, label: 'Headline' });
  if ('about' in body) update.about = cleanString(body.about, { max: 3000, label: 'About' });
  if ('location' in body) update.location = cleanString(body.location, { max: 100, label: 'Location' });
  if ('email' in body) update.email = cleanEmail(body.email);
  if ('skills' in body) update.skills = cleanList(body.skills, { label: 'Skills' });
  if ('github' in body) update.github = cleanUrl(body.github, 'GitHub URL');
  if ('linkedin' in body) update.linkedin = cleanUrl(body.linkedin, 'LinkedIn URL');
  if ('photoUrl' in body) update.photoUrl = cleanUrl(body.photoUrl, 'Photo URL');
  if (!Object.keys(update).length) throw new HttpError(400, 'Nothing to update.');
  const profile = await Profile.findOneAndUpdate({}, { $set: update }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
  res.json(profile);
}));

router.post('/profile/photo', uploadFile('file', IMAGE_TYPES), discardOnError(async (req, res) => {
  const old = await Profile.findOne().select('photoUrl').lean();
  const profile = await Profile.findOneAndUpdate({}, { $set: { photoUrl: req.file.url } }, { new: true, upsert: true, setDefaultsOnInsert: true });
  await removeUpload(old?.photoUrl);
  res.json({ photoUrl: profile.photoUrl });
}));

router.post('/resume', uploadFile('file', PDF_TYPES), discardOnError(async (req, res) => {
  const old = await Profile.findOne().select('resumeUrl').lean();
  const profile = await Profile.findOneAndUpdate({}, { $set: { resumeUrl: req.file.url } }, { new: true, upsert: true, setDefaultsOnInsert: true });
  await removeUpload(old?.resumeUrl);
  res.json({ resumeUrl: profile.resumeUrl });
}));

/* ---------- Projects ---------- */

const projectFields = (body, { partial }) => {
  const b = pick(body, ['title', 'description', 'technologies', 'githubUrl', 'liveUrl', 'imageUrl', 'featured']);
  const data = {};
  if (!partial || 'title' in b) data.title = cleanString(b.title, { max: 150, required: true, label: 'Title' });
  if (!partial || 'description' in b) data.description = cleanString(b.description, { max: 3000, required: true, label: 'Description' });
  if ('technologies' in b) data.technologies = cleanList(b.technologies, { label: 'Technologies' });
  if ('githubUrl' in b) data.githubUrl = cleanUrl(b.githubUrl, 'GitHub URL');
  if ('liveUrl' in b) data.liveUrl = cleanUrl(b.liveUrl, 'Live URL');
  if ('imageUrl' in b) data.imageUrl = cleanUrl(b.imageUrl, 'Image URL');
  if ('featured' in b) data.featured = cleanBool(b.featured);
  return data;
};

router.post('/projects', asyncHandler(async (req, res) => {
  res.status(201).json(await Project.create(projectFields(req.body, { partial: false })));
}));

router.put('/projects/:id', asyncHandler(async (req, res) => {
  const data = projectFields(req.body, { partial: true });
  if (!Object.keys(data).length) throw new HttpError(400, 'Nothing to update.');
  const project = await Project.findByIdAndUpdate(req.params.id, { $set: data }, { new: true, runValidators: true });
  if (!project) throw new HttpError(404, 'Project not found.');
  res.json(project);
}));

router.post('/projects/:id/image', uploadFile('file', IMAGE_TYPES), discardOnError(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new HttpError(404, 'Project not found.');
  const old = project.imageUrl;
  project.imageUrl = req.file.url;
  await project.save();
  await removeUpload(old);
  res.json(project);
}));

router.delete('/projects/:id', asyncHandler(async (req, res) => {
  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) throw new HttpError(404, 'Project not found.');
  await removeUpload(project.imageUrl);
  res.json({ message: 'Project deleted.' });
}));

/* ---------- Certificates ---------- */


router.post(
  '/certificates',
  uploadFile('file', CERT_TYPES),
  discardOnError(async (req, res) => {
    const cert = await Certificate.create({
      title: cleanString(req.body.title, {
        max: 150,
        required: true,
        label: 'Certificate title'
      }),
      issuer: cleanString(req.body.issuer, {
        max: 150,
        label: 'Issuer'
      }),
      issueDate: cleanString(req.body.issueDate, {
        max: 50,
        label: 'Issue date'
      }),
      fileUrl: req.file.url
    });

    res.status(201).json({
      message: 'Certificate uploaded successfully.',
      certificate: cert
    });
  })
);


router.delete('/certificates/:id', asyncHandler(async (req, res) => {
  const cert = await Certificate.findByIdAndDelete(req.params.id);
  if (!cert) throw new HttpError(404, 'Certificate not found.');
  await removeUpload(cert.fileUrl);
  res.json({ message: 'Certificate deleted.' });
}));

export default router;
