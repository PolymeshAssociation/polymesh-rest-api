/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { IsString } from 'class-validator';

import { IsBigNumber, ToBigNumber } from '~/common/decorators';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class CreateMultiSigDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'The number of approvals required in order for a proposal to be accepted',
    example: '1',
  })
  @IsBigNumber()
  @ToBigNumber()
  readonly requiredSignatures: BigNumber;

  @ApiProperty({
    description: 'The signers for the MultiSig',
    type: 'string',
    isArray: true,
    example: ['5GwwYnwCYcJ1Rkop35y7SDHAzbxrCkNUDD4YuCUJRPPXbvyV'],
  })
  @IsString({ each: true })
  readonly signers: string[];
}
