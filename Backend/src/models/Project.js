import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  technologies: { type: [String], default: [] },
  githubUrl: { type: String, default: '', maxlength: 2000 },
  liveUrl: { type: String, default: '', maxlength: 2000 },
  imageUrl: { type: String, default: '', maxlength: 2000 },
  featured: { type: Boolean, default: false }
}, { timestamps: true });

projectSchema.index({ featured: -1, createdAt: -1 });

export default mongoose.model('Project', projectSchema);
