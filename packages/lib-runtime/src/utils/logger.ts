/* eslint-disable no-console */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogFunction = (message?: any, ...optionalParams: any[]) => void;

type Logger = Record<'info' | 'warn' | 'error', LogFunction>;

const isProdEnv = process.env.NODE_ENV === 'production';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop: LogFunction = () => {};

export const consoleLogger: Logger = {
  info: isProdEnv ? noop : console.info,
  warn: console.warn,
  error: console.error,
};
