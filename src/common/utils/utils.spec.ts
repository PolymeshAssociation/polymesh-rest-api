import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PolymeshError } from '@polymathnetwork/polymesh-sdk/internal';
import { ErrorCode } from '@polymathnetwork/polymesh-sdk/types';

import { processQueue } from '~/common/utils/utils';
import { MockVenueClass } from '~/test-utils/mocks';

describe('processQueue', () => {
  describe('it should handle Polymesh errors', () => {
    test.each`
      code                         | expected
      ${ErrorCode.ValidationError} | ${BadRequestException}
      ${ErrorCode.FatalError}      | ${InternalServerErrorException}
    `('should transform $code code into $expected', async ({ code, expected }) => {
      const mockVenue = new MockVenueClass();
      mockVenue.modify.mockImplementation(() => {
        throw new PolymeshError({ code });
      });
      await expect(processQueue(mockVenue.modify as any, {}, {})).rejects.toBeInstanceOf(expected);
    });
  });

  describe('it should handle non polymesh errors', () => {
    it('should transform other errors into InternalServerException', async () => {
      const mockVenue = new MockVenueClass();
      mockVenue.modify.mockImplementation(() => {
        throw new Error('Foo');
      });
      await expect(processQueue(mockVenue.modify as any, {}, {})).rejects.toBeInstanceOf(
        InternalServerErrorException
      );
    });
  });
});
