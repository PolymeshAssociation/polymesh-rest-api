/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();

import { createMock } from '@golevelup/ts-jest';
import { PolymeshError } from '@polymeshassociation/polymesh-sdk/base/PolymeshError';
import { ErrorCode, MultiSig } from '@polymeshassociation/polymesh-sdk/types';
import { when } from 'jest-when';

import {
  AppError,
  AppInternalError,
  AppNotFoundError,
  AppUnauthorizedError,
  AppUnprocessableError,
  AppValidationError,
} from '~/common/errors';
import { Class, ProcessMode } from '~/common/types';
import { MockPolymeshTransaction, MockVenue } from '~/test-utils/mocks';
import {
  handleSdkError,
  MultiSigProposalResult,
  prepareProcedure,
  processTransaction,
} from '~/transactions/transactions.util';

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymeshassociation/polymesh-sdk/utils'),
  isPolymeshError: mockIsPolymeshError,
}));

describe('processTransaction', () => {
  describe('it should handle Polymesh errors', () => {
    type Case = [ErrorCode, Class<AppError>];
    const cases: Case[] = [
      [ErrorCode.NotAuthorized, AppUnauthorizedError],
      [ErrorCode.ValidationError, AppValidationError],
      [ErrorCode.UnmetPrerequisite, AppUnprocessableError],
      [ErrorCode.InsufficientBalance, AppUnprocessableError],
      [ErrorCode.DataUnavailable, AppNotFoundError],
      [ErrorCode.FatalError, AppInternalError],
    ];
    test.each(cases)('should transform %p into %p', async (code, expected) => {
      const mockVenue = new MockVenue();

      const mockError = { code, message: 'Error message' };
      mockVenue.modify.mockImplementation(() => {
        throw mockError;
      });

      mockIsPolymeshError.mockReturnValue(true);

      await expect(
        processTransaction(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          mockVenue.modify as any,
          {},
          {},
          { processMode: ProcessMode.Submit, signer: 'Alice' }
        )
      ).rejects.toBeInstanceOf(expected);

      mockIsPolymeshError.mockReset();
    });

    it('should catch address not present in signing manager errors', async () => {
      const mockVenue = new MockVenue();

      const mockError = {
        code: ErrorCode.General,
        message: 'The Account is not part of the Signing Manager attached to the SDK',
      };
      mockVenue.modify.mockImplementation(() => {
        throw mockError;
      });

      mockIsPolymeshError.mockReturnValue(true);

      await expect(
        processTransaction(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          mockVenue.modify as any,
          {},
          {},
          { processMode: ProcessMode.Submit, signer: 'Alice' }
        )
      ).rejects.toBeInstanceOf(AppValidationError);

      mockIsPolymeshError.mockReset();
    });
  });

  describe('it should handle non polymesh errors', () => {
    it('should transform errors into AppInternalError', async () => {
      const mockVenue = new MockVenue();
      const result = processTransaction(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockVenue.modify as any,
        {},
        {},
        { processMode: ProcessMode.Submit, signer: 'Alice' }
      );

      mockVenue.modify.mockImplementationOnce(() => {
        throw new Error('Foo');
      });

      await expect(result).rejects.toBeInstanceOf(AppInternalError);

      mockVenue.modify.mockImplementationOnce(() => {
        // eslint-disable-next-line no-throw-literal
        throw 'Some unexpected error';
      });

      await expect(result).rejects.toBeInstanceOf(AppInternalError);
    });
  });

  describe('with dryRun', () => {
    it('should handle dry run process mode', async () => {
      const mockVenue = new MockVenue();

      const mockTransaction = new MockPolymeshTransaction();
      const run = mockTransaction.run;

      mockVenue.modify.mockResolvedValue(mockTransaction);

      await processTransaction(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockVenue.modify as any,
        {},
        {},
        { processMode: ProcessMode.DryRun, signer: 'Alice' }
      );

      expect(run).not.toHaveBeenCalled();
    });

    it('should handle dry run process mode with MultiSig signers', async () => {
      const mockVenue = new MockVenue();

      const mockTransaction = new MockPolymeshTransaction();
      mockTransaction.multiSig = createMock<MultiSig>({ address: 'someAddress' });

      const runAsProposal = mockTransaction.runAsProposal;

      mockVenue.modify.mockResolvedValue(mockTransaction);

      const processedTx = await processTransaction(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockVenue.modify as any,
        {},
        {},
        { processMode: ProcessMode.DryRun, signer: 'Alice' }
      );

      expect(runAsProposal).not.toHaveBeenCalled();

      expect((processedTx as MultiSigProposalResult).result.toHuman()).toEqual({
        multiSigAddress: 'someAddress',
        id: '-1',
      });
    });
  });

  describe('with offline', () => {
    it('should handle offline process mode', async () => {
      const mockVenue = new MockVenue();

      const mockTransaction = new MockPolymeshTransaction();
      const run = mockTransaction.run;

      mockVenue.modify.mockResolvedValue(mockTransaction);

      await processTransaction(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockVenue.modify as any,
        {},
        {},
        { processMode: ProcessMode.Offline, signer: 'Alice' }
      );

      expect(run).not.toHaveBeenCalled();
    });
  });
});

describe('prepareProcedure', () => {
  const signingAccount = 'someAddress';
  it('should call the method with args when they are required', () => {
    const mockMethod = jest.fn();
    // define length so mock method appears to require args
    Object.defineProperty(mockMethod, 'length', { value: 1, writable: false });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prepareProcedure(mockMethod as any, { arg1: 'someValue' }, { signingAccount });

    expect(mockMethod).toHaveBeenCalledWith({ arg1: 'someValue' }, { signingAccount });
  });

  it('should call the method with only opts when args are not required', () => {
    const mockMethod = jest.fn();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prepareProcedure(mockMethod as any, {}, { signingAccount });

    expect(mockMethod).toHaveBeenCalledWith({ signingAccount });
  });
});

const testCases = [
  {
    inputError: new PolymeshError({ code: ErrorCode.NoDataChange, message: '' }),
    expectedError: AppValidationError,
    description: 'NoDataChange error',
    isPolymeshError: true,
  },
  {
    inputError: new PolymeshError({ code: ErrorCode.InsufficientBalance, message: '' }),
    expectedError: AppUnprocessableError,
    description: 'InsufficientBalance error',
    isPolymeshError: true,
  },
  {
    inputError: new PolymeshError({ code: ErrorCode.DataUnavailable, message: '' }),
    expectedError: AppNotFoundError,
    description: 'DataUnavailable error',
    isPolymeshError: true,
  },
  {
    inputError: new PolymeshError({ code: ErrorCode.FatalError, message: '' }),
    expectedError: AppInternalError,
    description: 'Unknown PolymeshError code',
    isPolymeshError: true,
  },
  {
    inputError: new Error(''),
    expectedError: AppInternalError,
    description: 'Generic Error',
    isPolymeshError: false,
  },
  {
    inputError: 'Unknown error',
    expectedError: AppInternalError,
    description: 'Unknown error type',
    isPolymeshError: false,
  },
] as const;

describe('handleSdkError', () => {
  testCases.forEach(({ inputError, expectedError, description, isPolymeshError }) => {
    test(`should handle ${description}`, () => {
      when(mockIsPolymeshError).calledWith(inputError).mockReturnValue(isPolymeshError);

      const error = handleSdkError(inputError);

      expect(error).toBeInstanceOf(expectedError);
    });
  });
});
