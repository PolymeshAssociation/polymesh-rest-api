/* istanbul ignore file */

import { LoggerService } from '@nestjs/common';

import { PolymeshLogger } from '~/logger/polymesh-logger.service';

class MockPolymeshLogger implements LoggerService {
  log = jest.fn();
  error = jest.fn();
  warn = jest.fn();
  debug = jest.fn();
  verbose = jest.fn();
  setContext = jest.fn();
}

export const mockPolymeshLoggerProvider = {
  provide: PolymeshLogger,
  useValue: new MockPolymeshLogger(),
};
