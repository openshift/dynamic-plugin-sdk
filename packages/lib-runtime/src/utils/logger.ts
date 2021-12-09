import * as _ from 'lodash-es';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogFunction = (message?: any, ...optionalParams: any[]) => void;

/**
 * Minimal logger interface.
 */
type Logger = Record<'info' | 'warn' | 'error', LogFunction>;

const isProdEnv = process.env.NODE_ENV === 'production';

/**
 * {@link Logger} implementation that uses the {@link console} API.
 */
export const consoleLogger: Logger = {
  /* eslint-disable no-console */
  info: isProdEnv ? _.noop : console.info,
  warn: console.warn,
  error: console.error,
  /* eslint-enable no-console */
};
