import { Router } from 'express';
import { changePassword, login, me, register } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { changePasswordRules, handleValidation, loginRules, registerRules } from '../middleware/validate.js';

const router = Router();
router.post('/register', authLimiter, registerRules, handleValidation, register);
router.post('/login', authLimiter, loginRules, handleValidation, login);
router.get('/me', protect, me);
router.put('/password', protect, authLimiter, changePasswordRules, handleValidation, changePassword);
export default router;
