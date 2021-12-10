import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { TargetTreatment } from '@polymathnetwork/polymesh-sdk/types';

import { CorporateActionDefaultsDto } from '~/corporate-actions/dto/corporate-action-defaults.dto';

type ValidCase = [string, Record<string, unknown>];
type InvalidCase = [string, Record<string, unknown>, string[]];

describe('corporateActionDefaultsDto', () => {
  const target: ValidationPipe = new ValidationPipe({ transform: true });
  const signer = '0x6'.padEnd(66, '0');
  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: CorporateActionDefaultsDto,
    data: '',
  };
  describe('valid Corporate Action Default values', () => {
    const cases: ValidCase[] = [
      [
        'Update all parameters',
        {
          targets: {
            treatment: TargetTreatment.Include,
            identities: ['0x6'.padEnd(66, '0')],
          },
          defaultTaxWithholding: '25',
          taxWithholdings: [
            {
              identity: '0x6'.padEnd(66, '0'),
              percentage: '10',
            },
          ],
          signer,
        },
      ],
      [
        'Update only `targets`',
        {
          targets: {
            treatment: TargetTreatment.Include,
            identities: ['0x6'.padEnd(66, '0')],
          },
          signer,
        },
      ],
      [
        'Update only `defaultTaxWithholding`',
        {
          defaultTaxWithholding: '25',
          signer,
        },
      ],
      [
        'Update only `taxWithholdings`',
        {
          taxWithholdings: [
            {
              identity: '0x6'.padEnd(66, '0'),
              percentage: '10',
            },
          ],
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
        'No values being updated',
        {
          signer,
        },
        ['defaultTaxWithholding must be a number'],
      ],
      [
        'All undefined params',
        {
          targets: undefined,
          defaultTaxWithholding: undefined,
          taxWithholdings: undefined,
          signer,
        },
        ['defaultTaxWithholding must be a number'],
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
