/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class RevokeSubsidyDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'Account address of the beneficiary whose pending subsidy will be revoked',
    example: '5EjsqfmY4JqMSrt7YQCe3if5DK4FrG98uUwZsaXmNW7aKdNM',
  })
  @IsString()
  readonly beneficiary: string;
}
