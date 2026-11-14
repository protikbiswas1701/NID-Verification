// Express 5 forwards rejected promises automatically, but keeping the wrapper
// makes the intent explicit and keeps this code portable to Express 4.
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
