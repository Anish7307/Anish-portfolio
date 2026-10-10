import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 150 },
  issuer: { type: String, default: '', trim: true, maxlength: 150 },
  issueDate: { type: String, default: '', trim: true, maxlength: 50 },
  fileUrl: { type: String, required: true },
  verifyUrl: { type: String, default: '', maxlength: 2000 }
}, { timestamps: true });

certificateSchema.index({ createdAt: -1 });

export default mongoose.model('Certificate', certificateSchema);
