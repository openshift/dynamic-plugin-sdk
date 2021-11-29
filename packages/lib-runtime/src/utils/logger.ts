/* eslint-disable no-console */
import * as _ from 'lodash-es';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogFunction = (message?: any, ...optionalParams: any[]) => void;

/**
 * Minimal logger interface.
 */
type Logger = Record<'info' | 'warn' | 'error', LogFunction>;

const isProdEnv = process.env.NODE_ENV === 'production';

export const consoleLogger: Logger = {
  info: isProdEnv ? _.noop : console.info,
  warn: console.warn,
  error: console.error,
};
