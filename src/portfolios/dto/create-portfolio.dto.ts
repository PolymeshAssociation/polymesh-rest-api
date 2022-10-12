/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class CreatePortfolioDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'The name of the Portfolio to be created',
    example: 'FOLIO-1',
  })
  @IsString()
  readonly name: string;
}
