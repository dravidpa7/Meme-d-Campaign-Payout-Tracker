import { Request, Response } from 'express';
import { requireUser } from '../middlewares/authenticate';
import { earningsService } from '../services/earnings.service';
import { asyncHandler } from '../utils/async-handler';

export const earningsController = {
  getMine: asyncHandler(async (req: Request, res: Response) => {
    res.json({ data: await earningsService.getForCreator(requireUser(req).id) });
  }),
};
