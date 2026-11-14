import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateToken } from '../utils/generateToken.js';
import { HttpError } from '../utils/httpError.js';

// POST /api/auth/register  -> always creates a normal "user". Any role in the body is ignored.
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) throw new HttpError(409, 'An account with this email already exists');

  const user = await User.create({ name, email, password, role: 'user' });
  res.status(201).json({ token: generateToken(user._id), user });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  // Same message for unknown email and wrong password to avoid account enumeration.
  if (!user || !(await user.matchPassword(password))) throw new HttpError(401, 'Invalid email or password');
  if (!user.isActive) throw new HttpError(403, 'This account has been deactivated');

  res.json({ token: generateToken(user._id), user });
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(currentPassword))) throw new HttpError(400, 'Current password is incorrect');
  if (currentPassword === newPassword) throw new HttpError(400, 'New password must be different from the current one');

  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated successfully' });
});
