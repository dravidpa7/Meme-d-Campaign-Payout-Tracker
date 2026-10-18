import { AppError } from './app-error';
import { ERROR_CODES } from './error-codes';

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: unknown) {
    super(400, ERROR_CODES.VALIDATION_ERROR, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, ERROR_CODES.UNAUTHORIZED, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have access to this resource') {
    super(403, ERROR_CODES.FORBIDDEN, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, ERROR_CODES.NOT_FOUND, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(409, ERROR_CODES.CONFLICT, message);
  }
}
