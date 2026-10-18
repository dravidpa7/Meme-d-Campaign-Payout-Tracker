import { Router } from 'express';
import { ROLES } from '../constants/roles';
import { submissionController } from '../controllers/submission.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { submitPostSchema, updateViewsBodySchema, updateViewsParamsSchema } from '../validators/submission.validator';

export const submissionRoutes = Router();

submissionRoutes.post('/', authenticate, authorize(ROLES.CREATOR), validate({ body: submitPostSchema }), submissionController.submit);
submissionRoutes.get('/mine', authenticate, authorize(ROLES.CREATOR), submissionController.listMine);

// Simulated platform data: NO authenticate/authorize by design, but input is still validated.
submissionRoutes.patch(
  '/:id/views',
  validate({ params: updateViewsParamsSchema, body: updateViewsBodySchema }),
  submissionController.updateViews,
);
