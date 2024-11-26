/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { ClaimType, CountryCode } from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { ConditionDto } from '~/compliance/dto/condition.dto';

export class SetRequirementsDto extends TransactionBaseDto {
  @ApiProperty({
    description:
      'Asset transfers must comply with all of the rules in one of the top level elements. Essentially each outer array element has an *or* between them, while the inner elements have an *and* between them',
    isArray: true,
    type: ConditionDto,
    example: [
      [
        {
          target: 'Both',
          type: 'IsNoneOf',
          claims: [
            {
              type: 'Blocked',
              scope: {
                type: 'Identity',
                value: '0x0600000000000000000000000000000000000000000000000000000000000000',
              },
            },
            {
              type: 'Jurisdiction',
              scope: {
                type: 'Asset',
                value: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
              },
              code: CountryCode.Us,
            },
          ],
          trustedClaimIssuers: [
            {
              identity: '0x0600000000000000000000000000000000000000000000000000000000000000',
              trustedFor: [ClaimType.Blocked],
            },
          ],
        },
      ],
      [
        {
          target: 'Sender',
          type: 'IsPresent',
          claim: {
            type: 'Accredited',
            scope: {
              type: 'Asset',
              value: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
            },
          },
        },
      ],
      [
        {
          target: 'Receiver',
          type: 'IsIdentity',
          identity: '0x0600000000000000000000000000000000000000000000000000000000000000',
        },
      ],
    ],
  })
  @Type(() => ConditionDto)
  @IsNotEmpty()
  @IsArray({ each: true })
  @ValidateNested({ each: true })
  readonly requirements: ConditionDto[][];
}
