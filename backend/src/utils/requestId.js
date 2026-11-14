import crypto from 'crypto';

// Example: NID-3F9A1C07BE  (cryptographically random, not guessable/sequential)
export const generateRequestId = () => `NID-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
