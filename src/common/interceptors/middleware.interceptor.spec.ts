import { ExecutionContext, NotImplementedException } from '@nestjs/common';

import { MiddlewareInterceptor } from '~/common/interceptors/middleware.interceptor';

const callHandler = {
  handle: jest.fn(),
};
const originalEnv = process.env;

describe('MiddlewareInterceptor', () => {
  let middlewareInterceptor: MiddlewareInterceptor;

  beforeEach(() => {
    jest.resetModules();
    middlewareInterceptor = new MiddlewareInterceptor();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(middlewareInterceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should throw a NotImplementedException if middleware url and api key are not defined', () => {
      let err;

      try {
        middlewareInterceptor.intercept({} as unknown as ExecutionContext, callHandler);
      } catch (e) {
        err = e;
      }

      expect(err).toBeInstanceOf(NotImplementedException);
      expect((err as NotImplementedException).message).toEqual(
        'Cannot make the request without an enabled middleware connection. Please provide `POLYMESH_MIDDLEWARE_URL` and `POLYMESH_MIDDLEWARE_API_KEY` in your environment'
      );
    });

    describe('otherwise', () => {
      it('should call the next CallHandler', () => {
        process.env = {
          ...originalEnv,
          POLYMESH_MIDDLEWARE_URL: 'http://localhost:3007/dev/graphql',
          POLYMESH_MIDDLEWARE_API_KEY: 'd41d8cd98f00b204e9800998ecf8427e',
        };
        middlewareInterceptor.intercept({} as unknown as ExecutionContext, callHandler);
        expect(callHandler.handle).toHaveBeenCalledTimes(1);
      });
    });
  });
});
