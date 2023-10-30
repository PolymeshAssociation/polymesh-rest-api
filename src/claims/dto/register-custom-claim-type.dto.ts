/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class RegisterCustomClaimTypeDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'The name of the CustomClaimType to be registered',
    example: 'Can Buy Asset',
  })
  @IsString()
  readonly name: string;
}
