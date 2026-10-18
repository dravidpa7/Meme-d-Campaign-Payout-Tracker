import { Router } from 'express';
import { ROLES } from '../constants/roles';
import { campaignController } from '../controllers/campaign.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { createCampaignSchema } from '../validators/campaign.validator';

export const campaignRoutes = Router();

// Any logged-in user can browse live campaigns (creators mainly).
campaignRoutes.get('/', authenticate, campaignController.listLive);
// Brand dashboard: own campaigns with spent vs remaining.
campaignRoutes.get('/mine', authenticate, authorize(ROLES.BRAND), campaignController.listMine);
campaignRoutes.post('/', authenticate, authorize(ROLES.BRAND), validate({ body: createCampaignSchema }), campaignController.create);
