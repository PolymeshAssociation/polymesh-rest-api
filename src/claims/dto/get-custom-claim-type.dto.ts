import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { IsOptional, IsString, ValidateIf } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';

export class GetCustomClaimTypeDto {
  @ApiProperty({
    description: 'The id of the CustomClaimType',
    example: '1',
  })
  @IsOptional()
  @IsBigNumber()
  @ToBigNumber()
  @ValidateIf(obj => !obj.name || obj.id)
  readonly id: BigNumber;

  @ApiProperty({
    description: 'The name of the CustomClaimType',
    example: 'Ticker Corp',
  })
  @ValidateIf(obj => !obj.id || obj.name)
  @IsOptional()
  @IsString()
  readonly name: string;
}
