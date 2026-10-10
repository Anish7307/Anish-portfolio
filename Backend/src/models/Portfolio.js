import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  name: { type: String, default: 'Anish Tiwari', trim: true, maxlength: 100 },
  headline: { type: String, default: 'Full Stack MERN Developer', trim: true, maxlength: 150 },
  about: { type: String, default: 'I am a fresher and web developer who enjoys building useful web applications.', trim: true, maxlength: 3000 },
  location: { type: String, default: 'India', trim: true, maxlength: 100 },
  email: { type: String, default: '', trim: true, lowercase: true, maxlength: 254 },
  skills: { type: [String], default: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Express.js', 'MongoDB', 'Java', 'SQL'] },
  github: { type: String, default: 'https://github.com/Anish7307', maxlength: 2000 },
  linkedin: { type: String, default: 'https://www.linkedin.com/in/anish-tiwari-2008032b6/', maxlength: 2000 },
  photoUrl: { type: String, default: '', maxlength: 2000 },
  resumeUrl: { type: String, default: '', maxlength: 2000 }
}, { timestamps: true });

export default mongoose.model('PortfolioProfile', profileSchema);
