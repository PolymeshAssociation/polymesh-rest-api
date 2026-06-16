/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class AcceptSubsidyDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'Account address of the subsidizer whose pending subsidy is being accepted',
    example: '5EjsqfmY4JqMSrt7YQCe3if5DK4FrG98uUwZsaXmNW7aKdNM',
  })
  @IsString()
  readonly subsidizer: string;
}
