import { NextFunction, Request, Response } from 'express';
import { Role } from '../constants/roles';
import { ForbiddenError, UnauthorizedError } from '../errors/http-errors';

export const authorize =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) return next(new ForbiddenError());
    next();
  };
