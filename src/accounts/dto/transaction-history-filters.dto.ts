/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { ExtrinsicsOrderBy, TxTag, TxTags } from '@polymeshassociation/polymesh-sdk/types';
import { IsBoolean, IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber, IsTxTag } from '~/common/decorators/validation';
import { getTxTags } from '~/common/utils';

export class TransactionHistoryFiltersDto {
  @ApiPropertyOptional({
    description: 'Number of the Block',
    type: 'string',
    example: '1000000',
  })
  @IsOptional()
  @IsBigNumber({ min: 0 })
  @ToBigNumber()
  readonly blockNumber?: BigNumber;

  @ApiPropertyOptional({
    description:
      'Hash of the Block. Note, this property will be ignored if `blockNumber` is also specified',
    type: 'string',
    example: '0x9d05973b0bacdbf26b705358fbcb7085354b1b7836ee1cc54e824810479dccf6',
  })
  @ValidateIf(
    ({ blockNumber, blockHash }: TransactionHistoryFiltersDto) => !blockNumber && !!blockHash
  )
  @IsString()
  readonly blockHash?: string;

  @ApiPropertyOptional({
    description: 'Transaction tags to be filtered',
    type: 'string',
    enum: getTxTags(),
    example: TxTags.asset.RegisterTicker,
  })
  @IsOptional()
  @IsTxTag()
  readonly tag?: TxTag;

  @ApiPropertyOptional({
    description: 'If true, only successful transactions are fetched',
    type: 'boolean',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  readonly success?: boolean;

  @ApiPropertyOptional({
    description: 'Number of transactions to be fetched',
    type: 'string',
    example: '10',
  })
  @IsOptional()
  @IsBigNumber()
  @ToBigNumber()
  readonly size?: BigNumber;

  @ApiPropertyOptional({
    description: 'Start index from which transactions are to be fetched',
    type: 'string',
    example: '1',
  })
  @IsOptional()
  @IsBigNumber()
  @ToBigNumber()
  readonly start?: BigNumber;

  @ApiPropertyOptional({
    description:
      'Order in which the transactions will be sorted based on the value of the `field`.  Note, this property will be ignored if `field` is not specified',
    type: 'string',
    enum: ExtrinsicsOrderBy,
    example: ExtrinsicsOrderBy.CreatedAtDesc,
  })
  @IsEnum(ExtrinsicsOrderBy)
  readonly orderBy: ExtrinsicsOrderBy = ExtrinsicsOrderBy.CreatedAtDesc;
}
