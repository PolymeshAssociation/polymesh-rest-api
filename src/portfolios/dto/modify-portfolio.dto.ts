/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class ModifyPortfolioDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'The new name of the Portfolio',
    example: 'FOLIO-1',
  })
  @IsString()
  readonly name: string;
}
