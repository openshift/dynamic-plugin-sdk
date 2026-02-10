import { noop } from 'lodash';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LogFunction = (message?: any, ...optionalParams: any[]) => void;

/**
 * Minimal logger interface.
 */
export type Logger = Record<'info' | 'warn' | 'error', LogFunction>;

const isDevEnv = process.env.NODE_ENV === 'development';

/**
 * {@link Logger} implementation that uses the {@link console} API.
 */
export const consoleLogger: Logger = {
  /* eslint-disable no-console */
  info: isDevEnv ? console.info : noop,
  warn: console.warn,
  error: console.error,
  /* eslint-enable no-console */
};
