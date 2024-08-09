/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class MultiSigParamsDto {
  @ApiProperty({
    description: 'The address of the MultiSig',
    example: '5HCKs1tNprs5S1pHHmsHXaQacSQbYDhLUCyoMZiM7KT8JkNb',
    type: 'string',
  })
  @IsString()
  readonly multiSigAddress: string;
}
