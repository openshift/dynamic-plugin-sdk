import { CustomError } from './CustomError';

/**
 * Custom error with a `cause` property.
 *
 * This shouldn't be needed once https://github.com/tc39/proposal-error-cause receives widespread support.
 */
export class ErrorWithCause extends CustomError {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
  }
}
