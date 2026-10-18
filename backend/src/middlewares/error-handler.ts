import { ErrorRequestHandler } from 'express';
import { logger } from '../config/logger';
import { DomainError } from '../domain/domain-error';
import { AppError } from '../errors/app-error';
import { ERROR_CODES } from '../errors/error-codes';

const DUPLICATE_KEY_CODE = 11000;

/** Single place where every error becomes an HTTP response. */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }

  // Invalid input caught by pure domain rules (bad milestones, bad amounts).
  if (err instanceof DomainError) {
    res.status(400).json({ error: { code: ERROR_CODES.VALIDATION_ERROR, message: err.message, details: { rule: err.code } } });
    return;
  }

  // Safety net for unique-index violations that slip past service-level checks.
  if ((err as { code?: number })?.code === DUPLICATE_KEY_CODE) {
    res.status(409).json({ error: { code: ERROR_CODES.CONFLICT, message: 'Resource already exists' } });
    return;
  }

  // Malformed JSON body.
  if ((err as { type?: string })?.type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Malformed JSON body' } });
    return;
  }

  logger.error({ err, method: req.method, url: req.originalUrl }, 'Unhandled error');
  res.status(500).json({ error: { code: ERROR_CODES.INTERNAL, message: 'Internal server error' } });
};
