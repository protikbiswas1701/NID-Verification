import { Router } from 'express';
import {
  dashboard, getUser, getVerification, getVerificationFile, listUsers, listVerifications, updateUserStatus, updateVerificationStatus, exportVerificationsCsv,
} from '../controllers/adminController.js';
import { reanalyzeVerification } from '../controllers/verificationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import {
  fileParams, handleValidation, idParam, listQueryRules, updateUserStatusRules, updateVerificationStatusRules, userListQueryRules,
} from '../middleware/validate.js';

const router = Router();
// Every admin route requires a valid token AND the admin role, enforced here on the server.
router.use(protect, authorize('admin'));

router.get('/dashboard', dashboard);
router.get('/verifications/export-csv', exportVerificationsCsv);
router.get('/users', userListQueryRules, handleValidation, listUsers);
router.get('/users/:id', idParam, handleValidation, getUser);
router.patch('/users/:id/status', updateUserStatusRules, handleValidation, updateUserStatus);
router.get('/verifications', listQueryRules, handleValidation, listVerifications);
router.get('/verifications/:id', idParam, handleValidation, getVerification);
router.post('/verifications/:id/analyze', idParam, handleValidation, reanalyzeVerification);
router.get('/verifications/:id/files/:side', fileParams, handleValidation, getVerificationFile);
router.patch('/verifications/:id/status', updateVerificationStatusRules, handleValidation, updateVerificationStatus);
export default router;
