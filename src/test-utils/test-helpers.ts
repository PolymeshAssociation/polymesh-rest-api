/* istanbul ignore file */

import { createMock } from '@golevelup/ts-jest';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  DistributionPayment,
  ResultSet,
  TxTag,
  TxTags,
} from '@polymeshassociation/polymesh-sdk/types';

import { processedTxResult, testValues, txResult } from '~/test-utils/consts';
import { MockAsset, MockPolymesh, MockTransaction } from '~/test-utils/mocks';
import { MockTransactionsService } from '~/test-utils/service-mocks';

/**
 * Helper to test controller methods that return processedTxResult
 * This pattern is common across many controller tests
 */
export const testControllerTxResult = async <TParams, TBody>(
  controllerMethod: (params: TParams, body: TBody) => Promise<unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceMock: jest.Mock<any, any, any>,
  params: TParams,
  body: TBody,
  expectedServiceCall?: (params: TParams, body: TBody) => unknown[]
): Promise<void> => {
  serviceMock.mockResolvedValue(txResult);

  const result = await controllerMethod(params, body);

  expect(result).toEqual(processedTxResult);
  if (expectedServiceCall) {
    expect(serviceMock).toHaveBeenCalledWith(...expectedServiceCall(params, body));
  }
};

/**
 * Helper to create a mock transaction with standard properties
 */
export const createMockTransaction = (overrides?: {
  blockHash?: string;
  txHash?: string;
  blockNumber?: BigNumber;
  tag?: TxTag;
}): MockTransaction => {
  return new MockTransaction({
    blockHash: '0x1',
    txHash: '0x2',
    blockNumber: new BigNumber(1),
    tag: TxTags.asset.CreateAsset,
    ...overrides,
  });
};

/**
 * Helper to test service methods that submit transactions
 * This pattern is common across many service tests
 */
export const testServiceTransactionSubmission = async <TParams, TBody>(
  serviceMethod: (params: TParams, body: TBody) => Promise<unknown>,
  mockTransactionsService: MockTransactionsService,
  params: TParams,
  body: TBody,
  expectedTransaction: MockTransaction,
  expectedSubmitCall?: {
    method: unknown;
    methodParams: unknown;
    options: unknown;
  }
): Promise<void> => {
  mockTransactionsService.submit.mockResolvedValue({
    result: undefined,
    transactions: [expectedTransaction],
  });

  const result = await serviceMethod(params, body);

  expect(result).toEqual({
    result: undefined,
    transactions: [expectedTransaction],
  });

  if (expectedSubmitCall) {
    expect(mockTransactionsService.submit).toHaveBeenCalledWith(
      expectedSubmitCall.method,
      expectedSubmitCall.methodParams,
      expectedSubmitCall.options
    );
  }
};

/**
 * Helper to test error handling with handleSdkError
 * This pattern is common across many service tests
 */
export const testErrorHandling = async <TParams>(
  serviceMethod: (params: TParams) => Promise<unknown>,
  mockMethod: jest.Mock,
  error: Error,
  params: TParams,
  handleSdkErrorSpy: jest.SpyInstance
): Promise<void> => {
  mockMethod.mockRejectedValue(error);

  await expect(() => serviceMethod(params)).rejects.toThrow();

  expect(handleSdkErrorSpy).toHaveBeenCalledWith(error);
};

/**
 * Helper to setup execTransaction test scenario
 * Used in polymesh.service.spec.ts to reduce duplication
 */
export const createExecTransactionTestSetup = (
  method?: string,
  isError = false
): {
  signer: string;
  tx: jest.Mock;
  params: string[];
  unsub: jest.Mock;
  receipt: {
    status: { isInBlock: boolean };
    isError: boolean;
    findRecord: jest.Mock;
  };
  signAndSend: jest.Mock;
} => {
  const signer = 'signer';
  const params = ['arg1', 'arg2'];
  const unsub = jest.fn();
  const receipt = {
    status: { isInBlock: true },
    isError,
    findRecord: jest.fn().mockReturnValue(!!isError),
  };
  const signAndSend = jest.fn().mockImplementation((_, __, cb) => {
    cb(receipt);
    return Promise.resolve(unsub);
  });
  const tx = jest.fn().mockReturnValue({ signAndSend });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (tx as any).method = method || 'someMethod';

  return {
    signer,
    tx,
    params,
    unsub,
    receipt,
    signAndSend,
  };
};

/**
 * Helper to create a standard transaction object for testing
 * Used to reduce duplication in service tests
 */
export const createStandardTransaction = (
  tag: TxTag
): {
  blockHash: string;
  txHash: string;
  blockNumber: BigNumber;
  tag: TxTag;
} => ({
  blockHash: '0x1',
  txHash: '0x2',
  blockNumber: new BigNumber(1),
  tag,
});

/**
 * Helper to test service methods that return transaction results with undefined result
 * Common pattern in identities and assets service tests
 */
export const testServiceTransactionResult = async <TBody>(
  serviceMethod: (body: TBody) => Promise<unknown>,
  mockTransactionsService: MockTransactionsService,
  body: TBody,
  tag: TxTag
): Promise<void> => {
  const transaction = createStandardTransaction(tag);
  const mockTransaction = new MockTransaction(transaction);
  mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });

  const result = await serviceMethod(body);

  expect(result).toEqual({
    result: undefined,
    transactions: [mockTransaction],
  });
  expect(mockTransactionsService.submit).toHaveBeenCalled();
};

/**
 * Helper to setup instruction mock for settlements controller tests
 * Reduces duplication in getInstruction test cases
 */
export const setupInstructionMock = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockInstruction: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  instructionDetails: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  legs?: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mediators: any[] = []
): void => {
  mockInstruction.details.mockResolvedValue(instructionDetails);
  mockInstruction.getStatus.mockResolvedValue({ status: instructionDetails.status });
  mockInstruction.getLegs.mockResolvedValue(legs ?? { data: [], next: null });
  mockInstruction.getMediators.mockResolvedValue(mediators);
};

/**
 * Helper to create a mock transaction and setup mockTransactionsService
 * Common pattern in identities and other service tests
 */
export const setupMockTransaction = (
  mockTransactionsService: MockTransactionsService,
  tag: TxTag
): MockTransaction => {
  const transaction = createStandardTransaction(tag);
  const mockTransaction = new MockTransaction(transaction);
  mockTransactionsService.submit.mockResolvedValue({ transactions: [mockTransaction] });
  return mockTransaction;
};

/**
 * Helper to create mock distribution payment for corporate actions tests
 */
export const createMockDistributionPayment = (
  did: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  overrides?: any
): {
  payment: DistributionPayment;
  rest: Omit<DistributionPayment, 'target'>;
  targetDid: string;
} => {
  const { blockHash, blockNumber } = testValues;
  const payment = createMock<DistributionPayment>({
    target: { did },
    amount: new BigNumber(100),
    date: new Date(),
    blockHash,
    blockNumber,
    withheldTax: new BigNumber(10),
    ...overrides,
  });
  const { target, ...rest } = payment;
  return { payment, rest, targetDid: target.did };
};

/**
 * Helper to create mock paginated result for distribution payments
 */
export const createMockPaymentHistoryResult = (
  payment: DistributionPayment,
  next: BigNumber = new BigNumber(2)
): ResultSet<DistributionPayment> => {
  return createMock<ResultSet<DistributionPayment>>({
    data: [payment],
    next,
  });
};

/**
 * Helper to test venue filtering operations in assets service
 */
export const testVenueFilteringOperation = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceMethod: (identifier: string, body: any) => any,
  mockPolymeshApi: MockPolymesh,
  mockTransactionsService: MockTransactionsService,
  identifier: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any,
  expectedGetAssetCall: { ticker?: string; assetId?: string },
  expectedSubmitParams: {
    enabled?: boolean;
    allowedVenues?: BigNumber[];
    disallowedVenues?: BigNumber[];
  }
): Promise<void> => {
  const mockAsset = new MockAsset();
  mockPolymeshApi.assets.getAsset.mockResolvedValue(mockAsset);
  mockTransactionsService.submit.mockResolvedValue(txResult);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = await serviceMethod(identifier, body);

  expect(result).toBe(txResult);
  expect(mockPolymeshApi.assets.getAsset).toHaveBeenCalledWith(expectedGetAssetCall);
  expect(mockTransactionsService.submit).toHaveBeenCalledWith(
    mockAsset.setVenueFiltering,
    expectedSubmitParams,
    expect.objectContaining({ signer: body.signer })
  );
};

/**
 * Helper to assert transaction result with undefined result
 * Common pattern in service tests
 */
export const expectTransactionResult = (
  result: unknown,
  mockTransaction: MockTransaction
): void => {
  expect(result).toEqual({
    result: undefined,
    transactions: [mockTransaction],
  });
};

/**
 * Helper to check the last submit call parameters
 * Common pattern in identities service tests
 */
export const expectLastSubmitCall = (
  mockTransactionsService: MockTransactionsService,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expectedParams: any
): void => {
  const submitCalls = mockTransactionsService.submit.mock.calls;
  const lastCall = submitCalls[submitCalls.length - 1];
  expect(lastCall[1]).toMatchObject(expectedParams);
};
