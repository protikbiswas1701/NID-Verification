import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';

// Verifies the Bearer JWT and loads a fresh user record on every request,
// so deactivated accounts lose access immediately.
export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'Account not found' });
    if (!user.isActive) return res.status(403).json({ message: 'This account has been deactivated' });

    req.user = user;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ message: 'Session expired. Please log in again.' });
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ message: 'Invalid token' });
    return next(err);
  }
};
