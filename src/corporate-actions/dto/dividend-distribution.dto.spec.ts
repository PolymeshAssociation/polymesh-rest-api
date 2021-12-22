import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { CaCheckpointType } from '@polymathnetwork/polymesh-sdk/types';

import { DividendDistributionDto } from '~/corporate-actions/dto/dividend-distribution.dto';
import { InvalidCase, ValidCase } from '~/test-utils/types';

describe('dividendDistributionDto', () => {
  const target: ValidationPipe = new ValidationPipe({ transform: true });
  const signer = '0x6'.padEnd(66, '0');
  const mockDate = new Date();
  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: DividendDistributionDto,
    data: '',
  };
  describe('valid values', () => {
    const cases: ValidCase[] = [
      [
        "checkpoint as 'Date'",
        {
          description: 'Corporate Action description',
          checkpoint: mockDate,
          originPortfolio: '0',
          currency: 'TICKER',
          perShare: '2',
          maxAmount: '1000',
          paymentDate: mockDate,
          signer,
        },
      ],
      [
        "checkpoint as 'CorporateActionCheckpointDto' with type 'Existing'",
        {
          description: 'Corporate Action description',
          checkpoint: {
            id: '1',
            type: CaCheckpointType.Existing,
          },
          originPortfolio: '0',
          currency: 'TICKER',
          perShare: '2',
          maxAmount: '1000',
          paymentDate: mockDate,
          signer,
        },
      ],
      [
        "checkpoint as 'CorporateActionCheckpointDto' with type 'Scheduled'",
        {
          description: 'Corporate Action description',
          checkpoint: {
            id: '1',
            type: CaCheckpointType.Schedule,
          },
          originPortfolio: '0',
          currency: 'TICKER',
          perShare: '2',
          maxAmount: '1000',
          paymentDate: mockDate,
          signer,
        },
      ],
    ];
    test.each(cases)('%s', async (_, input) => {
      await target.transform(input, metadata).catch(err => {
        fail(`should not make any errors, received: ${JSON.stringify(err.getResponse())}`);
      });
    });
  });

  describe('invalid invites', () => {
    const cases: InvalidCase[] = [
      [
        "'checkpoint' as random string",
        {
          description: 'Corporate Action description',
          checkpoint: 'abc',
          originPortfolio: '1',
          currency: 'TICKER',
          perShare: '2',
          maxAmount: '1000',
          paymentDate: mockDate,
          signer,
        },
        ["checkpoint must be a valid 'Date' or object of type 'CorporateActionCheckpointDto'"],
      ],
      [
        "'checkpoint' as random JSON",
        {
          description: 'Corporate Action description',
          checkpoint: {
            xyz: 'abc',
          },
          originPortfolio: '1',
          currency: 'TICKER',
          perShare: '2',
          maxAmount: '1000',
          paymentDate: mockDate,
          signer,
        },
        ["checkpoint must be a valid 'Date' or object of type 'CorporateActionCheckpointDto'"],
      ],
      [
        "checkpoint as 'CorporateActionCheckpointDto' with invalid type 'Existing'",
        {
          description: 'Corporate Action description',
          checkpoint: {
            id: '1',
            type: 'Unknown',
          },
          originPortfolio: '0',
          currency: 'TICKER',
          perShare: '2',
          maxAmount: '1000',
          paymentDate: mockDate,
          signer,
        },
        ["checkpoint must be a valid 'Date' or object of type 'CorporateActionCheckpointDto'"],
      ],
    ];

    test.each(cases)('%s', async (_, input, expected) => {
      let error;
      await target.transform(input, metadata).catch(err => {
        error = err.getResponse().message;
      });
      expect(error).toEqual(expected);
    });
  });
});
