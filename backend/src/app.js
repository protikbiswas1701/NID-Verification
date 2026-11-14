import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

if (env.isProd) app.set('trust proxy', 1); // correct client IPs behind a reverse proxy (rate limiting)

app.use(helmet());
app.use(cors({ origin: env.clientUrl.split(',').map((o) => o.trim()), methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }));
app.use(morgan(env.isProd ? 'combined' : 'dev'));
app.use(express.json({ limit: '100kb' }));
app.use('/api', apiLimiter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'nid-verify-api' }));
app.use('/api/auth', authRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/admin', adminRoutes);

// NOTE: private_uploads is deliberately NOT served with express.static.

app.use(notFound);
app.use(errorHandler);

export default app;
