import { RequestHandler } from 'express';
import { ZodError, ZodType } from 'zod';
import { BadRequestError } from '../errors/http-errors';

interface Schemas {
  body?: ZodType;
  params?: ZodType;
}

/** Validates (and replaces) req.body / req.params with the parsed, typed values. */
export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, _res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(
          new BadRequestError(
            'Validation failed',
            err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
          ),
        );
      }
      next(err);
    }
  };
