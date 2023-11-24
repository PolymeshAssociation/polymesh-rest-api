import { ApiProperty, PickType } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { IsString } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';

export class GetCustomClaimTypeDto {
  @ApiProperty({
    description: 'The id of the CustomClaimType',
    example: '1',
  })
  @IsBigNumber()
  @ToBigNumber()
  readonly id: BigNumber;

  @ApiProperty({
    description: 'The name of the CustomClaimType',
    example: 'Ticker Corp',
  })
  @IsString()
  readonly name: string;
}

export class GetCustomClaimTypeByNameDto extends PickType(GetCustomClaimTypeDto, [
  'name',
] as const) {}

export class GetCustomClaimTypeByIdDto extends PickType(GetCustomClaimTypeDto, ['id'] as const) {}
