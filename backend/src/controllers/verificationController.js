import Verification, { VERIFICATION_STATUSES } from '../models/Verification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { generateRequestId } from '../utils/requestId.js';
import { removeStoredFiles, sendPrivateFile } from '../utils/files.js';
import { buildPaginationMeta, escapeRegex, getPagination } from '../utils/query.js';
import { analyzeVerification } from '../services/aiService.js';

// Users never see who reviewed their request (or internal reviewer ids).
const USER_VISIBLE = '-reviewedBy -history.by';

const toFileInfo = (file) => ({
  filename: file.filename,
  originalName: String(file.originalname || '').replace(/[^\w.\- ]/g, '_').slice(0, 120),
  mimeType: file.mimetype,
  size: file.size,
});

/** Map an AI verdict to a workflow status */
const verdictToStatus = (verdict) => {
  switch (verdict) {
    case 'VERIFIED_GENUINE':        return 'COMPLETED';
    case 'SUSPECTED_FAKE':          return 'MANUAL_REVIEW';
    case 'UNVERIFIED_UNREGISTERED': return 'MANUAL_REVIEW';
    default:                        return 'PENDING_ANALYSIS';
  }
};

/** Apply an AI analysis result to a Verification document (mutates, does not save) */
const applyAnalysis = (verification, aiResult, label = 'Automated') => {
  if (!aiResult.success || !aiResult.analysis) return;
  const a = aiResult.analysis;

  // Store full result under aiResult for the frontend VerificationReport component
  verification.aiResult = {
    verdict: a.verdict,
    confidenceScore: a.confidenceScore,
    isGenuine: a.isGenuine,
    extractedData: a.extractedData,
    checks: a.checks,
    fraudIndicators: a.fraudIndicators,
    registryMatch: a.registryMatch,
    analyzedAt: a.analyzedAt,
  };

  // Also keep legacy analysis field for backwards compat
  verification.analysis = a;

  verification.status = verdictToStatus(a.verdict);
  const summary = a.isGenuine
    ? `${label} verification: Genuine (${a.confidenceScore}% confidence)`
    : `${label} verification: ${a.verdict} — ${(a.fraudIndicators || []).slice(0, 2).join('; ') || 'Anomalies detected'}`;

  verification.history.push({ status: verification.status, note: summary });
};

// POST /api/verifications  (multipart: frontImage required, backImage optional, selfieImage optional)
export const createVerification = asyncHandler(async (req, res) => {
  const front = req.files.frontImage[0];
  const back = req.files.backImage?.[0];
  const selfie = req.files.selfieImage?.[0];
  const storedNames = [front.filename, back?.filename, selfie?.filename].filter(Boolean);

  try {
    let verification;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        verification = await Verification.create({
          user: req.user._id,
          requestId: generateRequestId(),
          frontImage: toFileInfo(front),
          ...(back && { backImage: toFileInfo(back) }),
          ...(selfie && { selfieImage: toFileInfo(selfie) }),
          history: [{ status: 'PENDING_ANALYSIS', note: 'Request submitted' }],
        });
        break;
      } catch (err) {
        const isRequestIdCollision = err.code === 11000 && err.keyPattern?.requestId;
        if (!isRequestIdCollision || attempt === 2) throw err;
      }
    }

    // Automatically trigger fraud detection
    try {
      const aiResult = await analyzeVerification(verification);
      applyAnalysis(verification, aiResult, 'Automated');
      await verification.save();
    } catch (aiErr) {
      console.error('Automated analysis failed:', aiErr.message);
    }

    res.status(201).json({ verification: await Verification.findById(verification._id).select(USER_VISIBLE) });
  } catch (err) {
    await removeStoredFiles(storedNames);
    throw err;
  }
});

// POST /api/verifications/:id/analyze (re-run analysis — user or admin)
export const reanalyzeVerification = asyncHandler(async (req, res) => {
  // Allow admin to re-analyze any verification, users only their own
  let verification;
  if (req.user.role === 'admin') {
    verification = await Verification.findById(req.params.id);
    if (!verification) throw new HttpError(404, 'Verification request not found');
  } else {
    verification = await findOwned(req);
  }

  const aiResult = await analyzeVerification(verification);
  applyAnalysis(verification, aiResult, 'Re-analysis');
  await verification.save();

  res.json({ verification: await Verification.findById(verification._id).select(USER_VISIBLE) });
});

// GET /api/verifications?search=&status=&page=&limit=
export const listMyVerifications = asyncHandler(async (req, res) => {
  const paging = getPagination(req.query);
  const filter = { user: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search?.trim()) filter.requestId = { $regex: escapeRegex(req.query.search.trim()), $options: 'i' };

  const [items, total] = await Promise.all([
    Verification.find(filter).select(USER_VISIBLE).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit),
    Verification.countDocuments(filter),
  ]);
  res.json({ items, pagination: buildPaginationMeta(paging, total) });
});

// GET /api/verifications/stats
export const myStats = asyncHandler(async (req, res) => {
  const uid = req.user._id;

  const [statusRows, verdictRows] = await Promise.all([
    Verification.aggregate([
      { $match: { user: uid } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Verification.aggregate([
      { $match: { user: uid, 'aiResult.verdict': { $exists: true } } },
      { $group: { _id: '$aiResult.verdict', count: { $sum: 1 } } },
    ]),
  ]);

  const byStatus = Object.fromEntries(VERIFICATION_STATUSES.map((s) => [s, 0]));
  statusRows.forEach((r) => { byStatus[r._id] = r.count; });

  const byVerdict = {};
  verdictRows.forEach((r) => { byVerdict[r._id] = r.count; });

  res.json({
    total: Object.values(byStatus).reduce((a, b) => a + b, 0),
    pending: byStatus.PENDING_ANALYSIS,
    manualReview: byStatus.MANUAL_REVIEW,
    completed: byStatus.COMPLETED,
    rejected: byStatus.REJECTED,
    byStatus,
    byVerdict,
  });
});

const findOwned = async (req) => {
  const verification = await Verification.findOne({ _id: req.params.id, user: req.user._id });
  if (!verification) throw new HttpError(404, 'Verification request not found');
  return verification;
};

// GET /api/verifications/:id
export const getVerification = asyncHandler(async (req, res) => {
  const verification = await Verification.findOne({ _id: req.params.id, user: req.user._id }).select(USER_VISIBLE);
  if (!verification) throw new HttpError(404, 'Verification request not found');
  res.json({ verification });
});

// GET /api/verifications/:id/files/:side
export const getVerificationFile = asyncHandler(async (req, res) => {
  const verification = await findOwned(req);
  const target = req.params.side === 'front'
    ? verification.frontImage
    : req.params.side === 'back'
    ? verification.backImage
    : verification.selfieImage;
  await sendPrivateFile(res, target);
});

// DELETE /api/verifications/:id
export const deleteVerification = asyncHandler(async (req, res) => {
  const verification = await findOwned(req);
  await verification.deleteOne();
  await removeStoredFiles([verification.frontImage?.filename, verification.backImage?.filename, verification.selfieImage?.filename]);
  res.json({ message: 'Verification request deleted' });
});
