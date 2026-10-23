import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';

import {
  LoggingInterceptor,
  redactBody,
  REDACTED_VALUE,
} from '~/common/interceptors/logging.interceptor';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';

const mnemonic = 'clap reveal pledge miss useful motion pair goat book snow scrub bag';
const apiKey = 'XsQMQRpJqI/ViSdRXEa129mjOT9eJGn3pWGQL1S7Ibw=';

const makeMockExecutionContext = (method: string, url: string, body: unknown): ExecutionContext =>
  ({
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ method, url, body }),
      getResponse: jest.fn().mockReturnValue({ statusCode: 201 }),
    }),
  } as unknown as ExecutionContext);

describe('redactBody', () => {
  it('should redact sensitive fields at any depth, regardless of casing', () => {
    const body = {
      handle: 'alice',
      mnemonic,
      nested: { API_KEY: apiKey, list: [{ legitimacySecret: 'x', privateKey: 'y' }] },
      password: 'hunter2',
      amount: 10,
      memo: null,
    };

    expect(redactBody(body)).toEqual({
      handle: 'alice',
      mnemonic: REDACTED_VALUE,
      nested: {
        API_KEY: REDACTED_VALUE,
        list: [{ legitimacySecret: REDACTED_VALUE, privateKey: REDACTED_VALUE }],
      },
      password: REDACTED_VALUE,
      amount: 10,
      memo: null,
    });
  });

  it('should not mutate the original body', () => {
    const body = { mnemonic };

    redactBody(body);

    expect(body.mnemonic).toEqual(mnemonic);
  });

  it('should pass through non object values', () => {
    expect(redactBody(undefined)).toBeUndefined();
    expect(redactBody('text')).toEqual('text');
  });
});

describe('LoggingInterceptor', () => {
  let logger: jest.Mocked<Pick<PolymeshLogger, 'log' | 'warn' | 'error'>>;
  let interceptor: LoggingInterceptor;

  const loggedOutput = (): string =>
    JSON.stringify([
      ...logger.log.mock.calls,
      ...logger.warn.mock.calls,
      ...logger.error.mock.calls,
    ]);

  beforeEach(() => {
    logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
    interceptor = new LoggingInterceptor(logger as unknown as PolymeshLogger);
  });

  it('should never log a signer mnemonic on success', async () => {
    const context = makeMockExecutionContext('POST', '/signer', { handle: 'alice', mnemonic });
    const next: CallHandler = { handle: () => of({}) };

    await lastValueFrom(interceptor.intercept(context, next));

    expect(logger.log).toHaveBeenCalledWith(
      expect.objectContaining({ body: { handle: 'alice', mnemonic: REDACTED_VALUE } }),
      expect.any(String)
    );
    expect(loggedOutput()).not.toContain(mnemonic);
  });

  it('should never log an API key on a 4xx response', async () => {
    const context = makeMockExecutionContext('POST', '/auth/api-key/delete', { apiKey });
    const next: CallHandler = { handle: () => throwError(() => new BadRequestException()) };

    await expect(lastValueFrom(interceptor.intercept(context, next))).rejects.toThrow();

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ body: { apiKey: REDACTED_VALUE } }),
      expect.any(String)
    );
    expect(loggedOutput()).not.toContain(apiKey);
  });

  it('should never log a signer mnemonic on a 5xx response', async () => {
    const context = makeMockExecutionContext('POST', '/signer', { handle: 'alice', mnemonic });
    const next: CallHandler = {
      handle: () => throwError(() => new InternalServerErrorException()),
    };

    await expect(lastValueFrom(interceptor.intercept(context, next))).rejects.toThrow();

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ body: { handle: 'alice', mnemonic: REDACTED_VALUE } }),
      expect.anything(),
      expect.any(String)
    );
    expect(loggedOutput()).not.toContain(mnemonic);
  });
});
