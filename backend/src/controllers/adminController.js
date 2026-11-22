import User from '../models/User.js';
import Verification, { VERIFICATION_STATUSES } from '../models/Verification.js';
import CitizenRecord from '../models/CitizenRecord.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { sendPrivateFile } from '../utils/files.js';
import { buildPaginationMeta, escapeRegex, getPagination } from '../utils/query.js';
import { getRegistry, normalizeDob } from '../services/verificationService.js';

// GET /api/admin/dashboard
export const dashboard = asyncHandler(async (_req, res) => {
  const [totalUsers, statusRows, verdictRows, recent] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Verification.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Verification.aggregate([
      { $match: { 'aiResult.verdict': { $exists: true } } },
      { $group: { _id: '$aiResult.verdict', count: { $sum: 1 } } },
    ]),
    Verification.find().sort({ createdAt: -1 }).limit(6).select('-reviewedBy -history').populate('user', 'name email'),
  ]);
  const byStatus = Object.fromEntries(VERIFICATION_STATUSES.map((s) => [s, 0]));
  statusRows.forEach((r) => { byStatus[r._id] = r.count; });

  const byVerdict = {};
  verdictRows.forEach((r) => { byVerdict[r._id] = r.count; });

  res.json({
    stats: {
      totalUsers,
      totalVerifications: Object.values(byStatus).reduce((a, b) => a + b, 0),
      pending: byStatus.PENDING_ANALYSIS,
      manualReview: byStatus.MANUAL_REVIEW,
      completed: byStatus.COMPLETED,
      rejected: byStatus.REJECTED,
      genuineCount: byVerdict.VERIFIED_GENUINE || 0,
      fakeCount: byVerdict.SUSPECTED_FAKE || 0,
      unregisteredCount: byVerdict.UNVERIFIED_UNREGISTERED || 0,
      byVerdict,
    },
    recent,
  });
});

// GET /api/admin/users?search=&page=&limit=
export const listUsers = asyncHandler(async (req, res) => {
  const paging = getPagination(req.query);
  const filter = {};
  if (req.query.search?.trim()) {
    const rx = { $regex: escapeRegex(req.query.search.trim()), $options: 'i' };
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit),
    User.countDocuments(filter),
  ]);
  res.json({ items, pagination: buildPaginationMeta(paging, total) });
});

// GET /api/admin/users/:id
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'User not found');
  const [verificationCount, recent] = await Promise.all([
    Verification.countDocuments({ user: user._id }),
    Verification.find({ user: user._id }).sort({ createdAt: -1 }).limit(5).select('requestId status createdAt'),
  ]);
  res.json({ user, verificationCount, recent });
});

// PATCH /api/admin/users/:id/status   body: { isActive: boolean }
export const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'User not found');
  if (user._id.equals(req.user._id)) throw new HttpError(400, 'You cannot change your own account status');
  if (user.role === 'admin') throw new HttpError(403, 'Administrator accounts cannot be changed here');

  user.isActive = req.body.isActive;
  await user.save();
  res.json({ user });
});

// GET /api/admin/verifications?search=&status=&page=&limit=
export const listVerifications = asyncHandler(async (req, res) => {
  const paging = getPagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const term = req.query.search?.trim();
  if (term) {
    const rx = { $regex: escapeRegex(term), $options: 'i' };
    const userIds = await User.find({ $or: [{ name: rx }, { email: rx }] }).distinct('_id');
    filter.$or = [{ requestId: rx }, { user: { $in: userIds } }];
  }

  const [items, total] = await Promise.all([
    Verification.find(filter).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit)
      .select('-history').populate('user', 'name email').populate('reviewedBy', 'name'),
    Verification.countDocuments(filter),
  ]);
  res.json({ items, pagination: buildPaginationMeta(paging, total) });
});

const loadFull = (id) =>
  Verification.findById(id).populate('user', 'name email isActive').populate('reviewedBy', 'name').populate('history.by', 'name');

// GET /api/admin/verifications/:id
export const getVerification = asyncHandler(async (req, res) => {
  const verification = await loadFull(req.params.id);
  if (!verification) throw new HttpError(404, 'Verification request not found');
  res.json({ verification });
});

// GET /api/admin/verifications/:id/files/:side
export const getVerificationFile = asyncHandler(async (req, res) => {
  const verification = await Verification.findById(req.params.id);
  if (!verification) throw new HttpError(404, 'Verification request not found');
  // Minimal access audit trail. For production, write this to a persistent audit log.
  console.info(`[AUDIT] admin=${req.user._id} viewed ${req.params.side} image of ${verification.requestId} at ${new Date().toISOString()}`);
  const target = req.params.side === 'front'
    ? verification.frontImage
    : req.params.side === 'back'
    ? verification.backImage
    : verification.selfieImage;
  await sendPrivateFile(res, target);
});

// PATCH /api/admin/verifications/:id/status   body: { status, reviewNotes? }
export const updateVerificationStatus = asyncHandler(async (req, res) => {
  const verification = await Verification.findById(req.params.id);
  if (!verification) throw new HttpError(404, 'Verification request not found');

  const { status, reviewNotes } = req.body;
  verification.status = status;
  if (reviewNotes !== undefined) verification.reviewNotes = reviewNotes;
  verification.reviewedBy = req.user._id;
  verification.reviewedAt = new Date();
  verification.history.push({ status, note: reviewNotes || '', by: req.user._id });
  await verification.save();

  res.json({ verification: await loadFull(verification._id) });
});

// GET /api/admin/verifications/export-csv
export const exportVerificationsCsv = asyncHandler(async (_req, res) => {
  const records = await Verification.find()
    .sort({ createdAt: -1 })
    .populate('user', 'name email')
    .lean();

  const headers = [
    'Request ID',
    'User Name',
    'User Email',
    'Submitted At',
    'NID Number',
    'DOB',
    'Citizen Name',
    'AI Verdict',
    'Confidence Score (%)',
    'Registry Match',
    'Status',
    'Reviewer Notes',
  ];

  const escapeCsv = (str) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = records.map((r) => [
    r.requestId,
    r.user?.name || 'N/A',
    r.user?.email || 'N/A',
    r.createdAt ? new Date(r.createdAt).toISOString() : '',
    r.aiResult?.extractedData?.nidNumber || '',
    r.aiResult?.extractedData?.dob || '',
    r.aiResult?.extractedData?.name || '',
    r.aiResult?.verdict || r.status || '',
    r.aiResult?.confidenceScore ?? '',
    r.aiResult?.databaseMatch?.isRegistered ? 'YES' : 'NO',
    r.status,
    r.reviewNotes || '',
  ].map(escapeCsv).join(','));

  const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="nid_verifications_${Date.now()}.csv"`);
  res.send(csvContent);
});

// POST /api/admin/registry - Add or update citizen in national registry
export const createCitizenRecord = asyncHandler(async (req, res) => {
  const { nid, name, dob, bloodGroup, nameBn, father, mother, birthPlace, phone, address, barcodePin } = req.body;

  if (!nid || !name || !dob) {
    throw new HttpError(400, 'NID number, Citizen Name, and Date of Birth (DOB) are required.');
  }

  const cleanNid = String(nid).replace(/\D/g, '');
  if (![10, 13, 17].includes(cleanNid.length)) {
    throw new HttpError(400, 'NID must be exactly 10, 13, or 17 numeric digits.');
  }

  const normalizedBirthDate = normalizeDob(dob);
  if (!normalizedBirthDate) {
    throw new HttpError(400, 'Invalid Date of Birth format. Please use YYYY-MM-DD or DD Mon YYYY.');
  }

  const cleanBarcodePin = barcodePin ? String(barcodePin).replace(/\D/g, '') : null;
  const normalizedBg = bloodGroup ? bloodGroup.trim().toUpperCase().replace(/^0/, 'O') : null;

  const docData = {
    nid: cleanNid,
    name: name.trim().toUpperCase(),
    nameBn: nameBn?.trim() || null,
    dob: normalizedBirthDate,
    bloodGroup: normalizedBg,
    father: father?.trim() || null,
    mother: mother?.trim() || null,
    birthPlace: birthPlace?.trim() || null,
    phone: phone?.trim() || null,
    address: address?.trim() || null,
    barcodePin: cleanBarcodePin,
    addedBy: req.user._id,
  };

  const citizen = await CitizenRecord.findOneAndUpdate(
    { nid: cleanNid },
    docData,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Sync into memory registry cache immediately
  try {
    const memoryReg = getRegistry();
    memoryReg[cleanNid] = {
      dob: citizen.dob,
      name: citizen.name,
      nameBn: citizen.nameBn,
      father: citizen.father,
      mother: citizen.mother,
      bloodGroup: citizen.bloodGroup,
      birthPlace: citizen.birthPlace,
      phone: citizen.phone,
      address: citizen.address,
    };
    if (cleanBarcodePin) {
      memoryReg[cleanBarcodePin] = { ...memoryReg[cleanNid] };
    }
  } catch (memErr) {
    console.warn('Memory registry sync warning:', memErr.message);
  }

  res.status(201).json({ success: true, citizen });
});

// GET /api/admin/registry - List custom registered citizens
export const listCitizenRecords = asyncHandler(async (req, res) => {
  const paging = getPagination(req.query);
  const filter = {};

  if (req.query.search?.trim()) {
    const rx = new RegExp(escapeRegex(req.query.search.trim()), 'i');
    filter.$or = [{ nid: rx }, { name: rx }, { barcodePin: rx }];
  }

  const [items, total] = await Promise.all([
    CitizenRecord.find(filter)
      .sort({ createdAt: -1 })
      .skip(paging.skip)
      .limit(paging.limit)
      .populate('addedBy', 'name email')
      .lean(),
    CitizenRecord.countDocuments(filter),
  ]);

  res.json({ items, pagination: buildPaginationMeta(paging, total) });
});

// DELETE /api/admin/registry/:id - Remove custom citizen record
export const deleteCitizenRecord = asyncHandler(async (req, res) => {
  const citizen = await CitizenRecord.findById(req.params.id);
  if (!citizen) throw new HttpError(404, 'Citizen record not found');

  const { nid, barcodePin } = citizen;
  await citizen.deleteOne();

  // Remove from memory cache if present
  try {
    const memoryReg = getRegistry();
    delete memoryReg[nid];
    if (barcodePin) delete memoryReg[barcodePin];
  } catch (_e) {}

  res.json({ success: true, message: `Citizen ${nid} removed from custom registry.` });
});
