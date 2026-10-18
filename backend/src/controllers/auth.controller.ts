import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../utils/async-handler';
import { LoginBody, SignupBody } from '../validators/auth.validator';

export const authController = {
  signup: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.signup(req.body as SignupBody);
    res.status(201).json({ data: result });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as LoginBody;
    res.json({ data: await authService.login(email, password) });
  }),
};
