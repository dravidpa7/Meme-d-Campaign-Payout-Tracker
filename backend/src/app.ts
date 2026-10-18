import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middlewares/error-handler';
import { notFound } from './middlewares/not-found';
import { apiLimiter } from './middlewares/rate-limiter';
import { apiRouter } from './routes';

export function createApp(): express.Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1); // behind Render/Vercel proxies, so rate limiting sees the real client IP
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()) }));
  app.use(express.json({ limit: '10kb' }));
  app.use('/api', apiLimiter, apiRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

export const app = createApp();
