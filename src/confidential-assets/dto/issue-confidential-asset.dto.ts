/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { IsString } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class IssueConfidentialAssetDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'The amount of the Confidential Asset to issue',
    example: '1000',
    type: 'string',
  })
  @ToBigNumber()
  @IsBigNumber()
  readonly amount: BigNumber;

  @ApiProperty({
    description: "The asset issuer's Confidential Account to receive the minted Assets",
    example: '0xdeadbeef00000000000000000000000000000000000000000000000000000000',
    type: 'string',
  })
  @IsString()
  readonly account: string;
}
