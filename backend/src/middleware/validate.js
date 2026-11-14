import { body, param, query, validationResult } from 'express-validator';
import { VERIFICATION_STATUSES } from '../models/Verification.js';

export const handleValidation = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  return res.status(422).json({
    message: 'Validation failed',
    errors: result.array().map((e) => ({ field: e.path, message: e.msg })),
  });
};

const passwordRule = (field) =>
  body(field)
    .isString().withMessage('Password is required')
    .isLength({ min: 8, max: 72 }).withMessage('Password must be 8 to 72 characters')
    .matches(/[A-Za-z]/).withMessage('Password must contain a letter')
    .matches(/\d/).withMessage('Password must contain a number');

const emailRule = body('email').isString().trim().toLowerCase().isEmail().withMessage('Enter a valid email address').isLength({ max: 254 });

export const registerRules = [
  body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2 to 80 characters'),
  emailRule,
  passwordRule('password'),
];

export const loginRules = [emailRule, body('password').isString().notEmpty().withMessage('Password is required')];

export const changePasswordRules = [
  body('currentPassword').isString().notEmpty().withMessage('Current password is required'),
  passwordRule('newPassword'),
];

export const idParam = [param('id').isMongoId().withMessage('Invalid id')];
export const fileParams = [
  param('id').isMongoId().withMessage('Invalid id'),
  param('side').isIn(['front', 'back']).withMessage('Side must be front or back'),
];

export const listQueryRules = [
  query('status').optional({ values: 'falsy' }).isIn(VERIFICATION_STATUSES).withMessage('Invalid status'),
  query('search').optional().isString().isLength({ max: 100 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
];

export const userListQueryRules = [
  query('search').optional().isString().isLength({ max: 100 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
];

export const updateVerificationStatusRules = [
  ...idParam,
  body('status').isIn(VERIFICATION_STATUSES).withMessage('Invalid status'),
  body('reviewNotes').optional().isString().trim().isLength({ max: 1000 }).withMessage('Notes must be 1000 characters or fewer'),
];

export const updateUserStatusRules = [
  ...idParam,
  body('isActive').isBoolean({ strict: true }).withMessage('isActive must be true or false'),
];
