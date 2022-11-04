/**
 * Base class for custom errors.
 */
export class CustomError extends Error {
  constructor(message?: string) {
    super(message);

    // Set name as constructor name, while keeping its property descriptor compatible with Error.name
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new.target#new.target_in_constructors
    Object.defineProperty(this, 'name', {
      value: new.target.name,
      configurable: true,
    });

    // Populate stack property via Error.captureStackTrace (when available) or manually via new Error()
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}
