import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { TargetTreatment } from '@polymeshassociation/polymesh-sdk/types';

import { CorporateActionDefaultConfigDto } from '~/corporate-actions/dto/corporate-action-default-config.dto';
import { testValues } from '~/test-utils/consts';
import { InvalidCase, ValidCase } from '~/test-utils/types';

const { did, signer } = testValues;

describe('corporateActionDefaultConfigDto', () => {
  const target: ValidationPipe = new ValidationPipe({ transform: true });
  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: CorporateActionDefaultConfigDto,
    data: '',
  };
  describe('valid Corporate Action Default values', () => {
    const cases: ValidCase[] = [
      [
        'Update all parameters',
        {
          targets: {
            treatment: TargetTreatment.Include,
            identities: [did],
          },
          defaultTaxWithholding: '25',
          taxWithholdings: [
            {
              identity: did,
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
            identities: [did],
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
              identity: did,
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
