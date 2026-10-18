import { Request, Response } from 'express';
import { requireUser } from '../middlewares/authenticate';
import { campaignService } from '../services/campaign.service';
import { asyncHandler } from '../utils/async-handler';
import { CreateCampaignBody } from '../validators/campaign.validator';

export const campaignController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const campaign = await campaignService.create(requireUser(req).id, req.body as CreateCampaignBody);
    res.status(201).json({ data: campaign });
  }),

  listLive: asyncHandler(async (_req: Request, res: Response) => {
    res.json({ data: await campaignService.listLive() });
  }),

  listMine: asyncHandler(async (req: Request, res: Response) => {
    res.json({ data: await campaignService.listForBrand(requireUser(req).id) });
  }),
};
