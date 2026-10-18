import { rateLimit } from 'express-rate-limit';
import { ERROR_CODES } from '../errors/error-codes';

const handler = { error: { code: ERROR_CODES.RATE_LIMITED, message: 'Too many requests, please slow down' } };

export const apiLimiter = rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false, message: handler });

/** Stricter limit on login/signup to slow down credential stuffing. */
export const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: handler });
