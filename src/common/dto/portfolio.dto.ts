/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsOptional } from 'class-validator';

import { IsDid } from '~/common/decorators/validation';

export class PortfolioDto {
  @ApiProperty({
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsDid()
  readonly did: string;

  @ApiProperty({
    nullable: true,
    example: '123',
    description: 'Portfolio number, do not send any value for the Default Portfolio',
  })
  @IsOptional()
  @IsNumberString()
  readonly id?: string;
}
