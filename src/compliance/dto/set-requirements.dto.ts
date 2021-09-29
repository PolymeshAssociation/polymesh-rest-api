/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { ClaimType, CountryCode } from '@polymathnetwork/polymesh-sdk/types';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';

import { SignerDto } from '~/common/dto/signer.dto';
import { ConditionDto } from '~/compliance/dto/condition.dto';

export class SetRequirementsDto extends SignerDto {
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
                type: 'Identity',
                value: '0x0600000000000000000000000000000000000000000000000000000000000000',
              },
              code: CountryCode.Us,
            },
          ],
          trustedClaimIssuers: [
            {
              identity: {
                did: '0x0600000000000000000000000000000000000000000000000000000000000000',
              },
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
              type: 'Identity',
              value: '0x0600000000000000000000000000000000000000000000000000000000000000',
            },
          },
        },
      ],
      [
        {
          target: 'Receiver',
          type: 'IsIdentity',
          identity: {
            did: '0x0600000000000000000000000000000000000000000000000000000000000000',
          },
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
