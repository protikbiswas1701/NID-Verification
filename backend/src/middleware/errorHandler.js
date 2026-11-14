import { env } from '../config/env.js';

export const notFound = (req, res) =>
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });

// Central error handler: converts known library errors into safe API responses.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Server error';

  if (err.name === 'MulterError') {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `File too large. Maximum size is ${env.maxFileSizeMb} MB per image.`
        : err.code === 'LIMIT_UNEXPECTED_FILE'
          ? 'Unexpected upload field. Use frontImage and backImage.'
          : err.message;
  } else if (err.name === 'ValidationError' && err.errors) {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier';
  } else if (err.code === 11000) {
    status = 409;
    message = 'A record with this value already exists';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON body';
  }

  if (status >= 500) {
    console.error(err);
    if (env.isProd) message = 'Internal server error';
  }
  res.status(status).json({ message });
};
