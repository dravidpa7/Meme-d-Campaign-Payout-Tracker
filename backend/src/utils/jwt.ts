import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { Role } from '../constants/roles';

export interface TokenPayload {
  sub: string;
  role: Role;
}

export function signToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === 'string' || typeof decoded.sub !== 'string' || !decoded['role']) {
    throw new Error('Malformed token payload');
  }
  return { sub: decoded.sub, role: decoded['role'] as Role };
}
