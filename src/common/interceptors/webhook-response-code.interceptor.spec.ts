import { ExecutionContext } from '@nestjs/common';

import { WebhookResponseCodeInterceptor } from '~/common/interceptors/webhook-response-code.interceptor';

const interceptor = new WebhookResponseCodeInterceptor();

const makeMockExecutionContext = (
  body: Record<string, string>,
  mockResponse: Record<string, number>
): ExecutionContext =>
  ({
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        body,
      }),
      getResponse: jest.fn().mockReturnValue(mockResponse),
    }),
  } as unknown as ExecutionContext);

describe('webHookResponseCodeInterceptor', () => {
  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('when a response is for a webhook the status code should be 202', () => {
    const mockResponse = { statusCode: 201 };
    const executionContext = makeMockExecutionContext(
      { webhookUrl: 'http://example.com' },
      mockResponse
    );

    const next = { handle: jest.fn() };
    interceptor.intercept(executionContext, next);

    expect(mockResponse.statusCode).toEqual(202);
    expect(next.handle).toHaveBeenCalled();
  });

  it('should not alter a non 201 response', () => {
    const mockResponse = { statusCode: 400 };
    const executionContext = makeMockExecutionContext(
      { webhookUrl: 'http://example.com' },
      mockResponse
    );

    const next = { handle: jest.fn() };
    interceptor.intercept(executionContext as unknown as ExecutionContext, next);

    expect(mockResponse.statusCode).toEqual(400);
    expect(next.handle).toHaveBeenCalled();
  });

  it('when a response is a non-webhook the status code should be unaltered', () => {
    const mockResponse = { statusCode: 201 };
    const executionContext = makeMockExecutionContext({}, mockResponse);

    const next = { handle: jest.fn() };
    interceptor.intercept(executionContext as unknown as ExecutionContext, next);

    expect(mockResponse.statusCode).toEqual(201);
    expect(next.handle).toHaveBeenCalled();
  });
});
