/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { ConfidentialLegAmountDto } from '~/confidential-transactions/dto/confidential-leg-amount.dto';

export class SenderAffirmConfidentialTransactionDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'Index of the leg to be affirmed in the Confidential Transaction',
    type: 'string',
    example: '1',
  })
  @ToBigNumber()
  @IsBigNumber()
  readonly legId: BigNumber;

  @ApiProperty({
    description: 'Affirming party',
    type: ConfidentialLegAmountDto,
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfidentialLegAmountDto)
  readonly legAmounts: ConfidentialLegAmountDto[];
}
