// Server-side role check. Hiding UI elements is never treated as authorisation.
export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'You do not have permission to do this' });
    return next();
  };
