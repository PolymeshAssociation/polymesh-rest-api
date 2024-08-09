/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { IsString } from 'class-validator';

import { IsBigNumber, ToBigNumber } from '~/common/decorators';

export class MultiSigProposalParamsDto {
  @ApiProperty({
    description: 'The MultiSig address',
    type: 'string',
    example: '5HCKs1tNprs5S1pHHmsHXaQacSQbYDhLUCyoMZiM7KT8JkNb',
  })
  @IsString()
  readonly multiSigAddress: string;

  @ApiProperty({
    description: 'The proposal ID',
    type: 'string',
    example: '7',
  })
  @IsBigNumber()
  @ToBigNumber()
  readonly proposalId: BigNumber;
}
