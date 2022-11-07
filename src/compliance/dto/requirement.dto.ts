/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { ClaimType, CountryCode } from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { ConditionDto } from '~/compliance/dto/condition.dto';

export class RequirementDto extends TransactionBaseDto {
  @ApiProperty({
    description:
      'Asset transfers must comply with all of the rules in one of the top level elements. Essentially each outer array element has an *or* between them, while the inner elements have an *and* between them',
    type: ConditionDto,
    example: [
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
              type: 'Ticker',
              value: 'TICKER',
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
  })
  @Type(() => ConditionDto)
  @IsNotEmpty()
  @ValidateNested({ each: true })
  readonly conditions: ConditionDto[];
}
