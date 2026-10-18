import { Request, Response } from 'express';
import { requireUser } from '../middlewares/authenticate';
import { payoutService } from '../services/payout.service';
import { submissionService } from '../services/submission.service';
import { asyncHandler } from '../utils/async-handler';
import { SubmitPostBody, UpdateViewsBody } from '../validators/submission.validator';

export const submissionController = {
  submit: asyncHandler(async (req: Request, res: Response) => {
    const submission = await submissionService.submitPost(requireUser(req).id, req.body as SubmitPostBody);
    res.status(201).json({ data: submission });
  }),

  listMine: asyncHandler(async (req: Request, res: Response) => {
    res.json({ data: await submissionService.listMine(requireUser(req).id) });
  }),

  /** Simulates platform view data. Intentionally has no auth/role check (per the brief). */
  updateViews: asyncHandler(async (req: Request, res: Response) => {
    const { views } = req.body as UpdateViewsBody;
    res.json({ data: await payoutService.updateViews(req.params['id'] as string, views) });
  }),
};
