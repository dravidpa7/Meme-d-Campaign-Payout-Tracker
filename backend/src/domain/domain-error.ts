/**
 * Error thrown by pure domain functions when given invalid input.
 * Intentionally independent from the HTTP-aware AppError so the
 * domain layer has zero imports from the rest of the app.
 * Services catch this and translate it to a BadRequest.
 */
export class DomainError extends Error {
  public readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}
