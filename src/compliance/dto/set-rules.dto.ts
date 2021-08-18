/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';

import { SignerDto } from '~/common/dto/signer.dto';
import { ConditionDto } from '~/compliance/dto/condition.dto';

// This introduces an extra level of nesting, but makes the validation easier
export class ConditionGroupDto {
  @ApiProperty({
    isArray: true,
    description:
      'An array of conditions Asset transfers. Transfers that meet the requirement of at least one `conditionSet` will be allowed',
    type: ConditionDto,
  })
  @Type(() => ConditionDto)
  @ValidateNested({ each: true })
  conditionSet: ConditionDto[];
}

export class SetRulesDto extends SignerDto {
  @ApiProperty({
    description:
      'Asset transfers must comply with all of the rules with at least one `conditionSet`. Essentially each `conditionSet` has an *or* between them, while the inner elements have an *and* between them',
    isArray: true,
    type: ConditionGroupDto,
    example: [
      {
        conditionSet: [
          {
            target: 'Sender',
            type: 'IsNoneOf',
            claims: [
              {
                type: 'Accredited',
                scope: {
                  type: 'Identity',
                  value: '0x0600000000000000000000000000000000000000000000000000000000000000',
                },
              },
            ],
          },
        ],
      },
    ],
  })
  @Type(() => ConditionGroupDto)
  @IsNotEmpty()
  @ValidateNested({ each: true })
  requirements: ConditionGroupDto[];
}
