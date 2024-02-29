/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class ToggleFreezeConfidentialAccountAssetDto extends TransactionBaseDto {
  @ApiProperty({
    description:
      'The Confidential Account for which trading for a specific confidential asset is being modified',
    example: '0xdeadbeef00000000000000000000000000000000000000000000000000000000',
    type: 'string',
  })
  @IsString()
  readonly confidentialAccount: string;
}
