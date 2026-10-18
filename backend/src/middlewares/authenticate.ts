import { NextFunction, Request, Response } from 'express';
import { AuthUser } from '../types/auth.types';
import { UnauthorizedError } from '../errors/http-errors';
import { verifyToken } from '../utils/jwt';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(new UnauthorizedError());

  try {
    const payload = verifyToken(header.slice('Bearer '.length));
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

/** Use inside controllers after `authenticate` has run. */
export function requireUser(req: Request): AuthUser {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}
