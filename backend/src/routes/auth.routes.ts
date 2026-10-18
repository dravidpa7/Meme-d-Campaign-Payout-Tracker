import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authLimiter } from '../middlewares/rate-limiter';
import { validate } from '../middlewares/validate';
import { loginSchema, signupSchema } from '../validators/auth.validator';

export const authRoutes = Router();

authRoutes.post('/signup', authLimiter, validate({ body: signupSchema }), authController.signup);
authRoutes.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);
