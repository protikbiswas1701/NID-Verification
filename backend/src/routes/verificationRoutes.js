import { Router } from 'express';
import {
  createVerification,
  deleteVerification,
  getVerification,
  getVerificationFile,
  listMyVerifications,
  myStats,
  reanalyzeVerification,
} from '../controllers/verificationController.js';
import { processBatchZip } from '../controllers/batchController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import { uploadNid, uploadZip } from '../middleware/uploadMiddleware.js';
import { validateSignatures } from '../middleware/fileSignature.js';
import { fileParams, handleValidation, idParam, listQueryRules } from '../middleware/validate.js';

const router = Router();
router.use(protect);

router.get('/stats', myStats);
router.post('/batch-zip', uploadLimiter, uploadZip, processBatchZip);
router.post('/', uploadLimiter, uploadNid, validateSignatures, createVerification);
router.get('/', listQueryRules, handleValidation, listMyVerifications);
router.get('/:id', idParam, handleValidation, getVerification);
router.post('/:id/analyze', idParam, handleValidation, reanalyzeVerification);
router.get('/:id/files/:side', fileParams, handleValidation, getVerificationFile);
router.delete('/:id', idParam, handleValidation, deleteVerification);

export default router;
