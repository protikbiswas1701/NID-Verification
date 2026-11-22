import mongoose from 'mongoose';

const storedFileSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, unique: true, index: true },
    data: { type: Buffer, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('StoredFile', storedFileSchema);
