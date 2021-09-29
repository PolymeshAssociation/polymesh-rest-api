import { BadRequestException, HttpException, InternalServerErrorException } from '@nestjs/common';
import { PolymeshError } from '@polymathnetwork/polymesh-sdk/internal';
import { ErrorCode } from '@polymathnetwork/polymesh-sdk/types';

import { Class } from '~/common/types';
import { processQueue } from '~/common/utils/utils';
import { MockVenue } from '~/test-utils/mocks';

describe('processQueue', () => {
  describe('it should handle Polymesh errors', () => {
    type Case = [ErrorCode, Class<HttpException>];
    const cases: Case[] = [
      [ErrorCode.ValidationError, BadRequestException],
      [ErrorCode.FatalError, InternalServerErrorException],
    ];
    test.each(cases)('should transform %p into %p', async (code, expected) => {
      const mockVenue = new MockVenue();
      mockVenue.modify.mockImplementation(() => {
        throw new PolymeshError({ code });
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(processQueue(mockVenue.modify as any, {}, {})).rejects.toBeInstanceOf(expected);
    });
  });

  describe('it should handle non polymesh errors', () => {
    it('should transform errors into InternalServerException', async () => {
      const mockVenue = new MockVenue();
      mockVenue.modify.mockImplementation(() => {
        throw new Error('Foo');
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(processQueue(mockVenue.modify as any, {}, {})).rejects.toBeInstanceOf(
        InternalServerErrorException
      );
    });
  });
});
