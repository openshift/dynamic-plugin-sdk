import { consoleLogger } from './logger';

describe('consoleLogger', () => {
  let consoleSpy: jest.SpyInstance<void, [message?: unknown, ...optionalParams: unknown[]]>;
  beforeEach(() => {
    jest.resetModules();
    consoleSpy = jest.spyOn(global.console, 'info');
  });

  test('should have all console loggers', () => {
    process.env.NODE_ENV = 'development';
    expect(consoleLogger.warn).toBeDefined();
    expect(consoleLogger.error).toBeDefined();
    expect(consoleLogger.info).toBeDefined();
    consoleLogger.info('foo');
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });

  test('should have all console loggers except info on prod', () => {
    process.env.NODE_ENV = 'production';
    expect(consoleLogger.warn).toBeDefined();
    expect(consoleLogger.error).toBeDefined();
    expect(consoleLogger.info).toBeDefined();
    consoleLogger.info('bar');
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).not.toHaveBeenCalledWith('bar');
  });
});
