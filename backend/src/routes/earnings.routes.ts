import { Router } from 'express';
import { ROLES } from '../constants/roles';
import { earningsController } from '../controllers/earnings.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

export const earningsRoutes = Router();

earningsRoutes.get('/me', authenticate, authorize(ROLES.CREATOR), earningsController.getMine);
