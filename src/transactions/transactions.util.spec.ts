/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();

import { ErrorCode } from '@polymeshassociation/polymesh-sdk/types';

import {
  AppError,
  AppInternalError,
  AppNotFoundError,
  AppUnprocessableError,
  AppValidationError,
} from '~/common/errors';
import { Class } from '~/common/types';
import { MockVenue } from '~/test-utils/mocks';
import { prepareProcedure, processTransaction } from '~/transactions/transactions.util';

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymeshassociation/polymesh-sdk/utils'),
  isPolymeshError: mockIsPolymeshError,
}));

describe('processTransaction', () => {
  describe('it should handle Polymesh errors', () => {
    type Case = [ErrorCode, Class<AppError>];
    const cases: Case[] = [
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(processTransaction(mockVenue.modify as any, {}, {})).rejects.toBeInstanceOf(
        expected
      );

      mockIsPolymeshError.mockReset();
    });
  });

  describe('it should handle non polymesh errors', () => {
    it('should transform errors into AppInternalError', async () => {
      const mockVenue = new MockVenue();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = processTransaction(mockVenue.modify as any, {}, {});

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
});

describe('prepareProcedure', () => {
  const signingAccount = 'someAddress';
  it('should call the method with args when they are given', () => {
    const mockMethod = jest.fn();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prepareProcedure(mockMethod as any, { arg1: 'someValue' }, { signingAccount });

    expect(mockMethod).toHaveBeenCalledWith({ arg1: 'someValue' }, { signingAccount });
  });

  it('should call the method with only opts when args are not given', () => {
    const mockMethod = jest.fn();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prepareProcedure(mockMethod as any, {}, { signingAccount });

    expect(mockMethod).toHaveBeenCalledWith({ signingAccount });
  });
});
