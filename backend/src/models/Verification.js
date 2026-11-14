import mongoose from 'mongoose';

export const VERIFICATION_STATUSES = ['PENDING_ANALYSIS', 'MANUAL_REVIEW', 'COMPLETED', 'REJECTED'];

// Metadata about a privately stored image. `filename` is the server-generated
// random name on disk; it is stripped from API responses.
const fileSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, maxlength: 150 },
    mimeType: { type: String, required: true, enum: ['image/jpeg', 'image/png', 'image/webp'] },
    size: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);
fileSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.filename;
    return ret;
  },
});

const historySchema = new mongoose.Schema(
  {
    status: { type: String, enum: VERIFICATION_STATUSES, required: true },
    note: { type: String, maxlength: 1000, default: '' },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const verificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestId: { type: String, required: true, unique: true },
    documentType: { type: String, enum: ['NID'], default: 'NID' },
    frontImage: { type: fileSchema, required: true },
    backImage: { type: fileSchema },
    selfieImage: { type: fileSchema },
    // Workflow status only. It is NOT a statement about whether an NID is genuine.
    status: { type: String, enum: VERIFICATION_STATUSES, default: 'PENDING_ANALYSIS' },
    reviewNotes: { type: String, maxlength: 1000, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    history: { type: [historySchema], default: [] },
    // AI fraud detection result (verdict, confidence, extracted data, checks)
    aiResult: { type: mongoose.Schema.Types.Mixed, default: null },
    // Legacy analysis field (kept for backwards compatibility)
    analysis: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

verificationSchema.index({ user: 1, createdAt: -1 });
verificationSchema.index({ status: 1, createdAt: -1 });

verificationSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Verification', verificationSchema);
