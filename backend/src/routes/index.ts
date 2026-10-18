import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { campaignRoutes } from './campaign.routes';
import { earningsRoutes } from './earnings.routes';
import { submissionRoutes } from './submission.routes';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/campaigns', campaignRoutes);
apiRouter.use('/submissions', submissionRoutes);
apiRouter.use('/earnings', earningsRoutes);
