/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class RegisterDidDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'Account address for which to create an Identity',
    example: '5grwXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXx',
  })
  @IsString()
  readonly targetAccount: string;
}
