import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { ArrayNotEmpty } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class VenueIdsDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'List of venue IDs to include in the request',
    type: 'string',
    isArray: true,
    example: ['1', '2'],
  })
  @ArrayNotEmpty()
  @ToBigNumber()
  @IsBigNumber()
  readonly venues: BigNumber[];
}
