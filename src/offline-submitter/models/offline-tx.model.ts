/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { TransactionPayload } from '@polymeshassociation/polymesh-sdk/types';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum OfflineTxStatus {
  Signed = 'Signed',
  Finalized = 'Finalized',
}

export class OfflineTxModel {
  @ApiProperty({
    description: 'The DB primary ID',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'The transaction payload to be signed',
  })
  payload: TransactionPayload;

  @ApiProperty({
    description: 'The signature for the transaction',
  })
  @IsString()
  signature: string;

  @ApiProperty({
    description: 'The status of the transaction',
    enum: OfflineTxStatus,
  })
  @IsEnum(OfflineTxStatus)
  status: OfflineTxStatus = OfflineTxStatus.Signed;

  @ApiProperty({
    description: 'The account signing the transaction',
  })
  @IsString()
  readonly address: string;

  @ApiProperty({
    description: 'The nonce of the transaction',
  })
  @IsNumber()
  readonly nonce: number;

  @ApiProperty({
    description: 'The block hash the transaction was included in',
  })
  @IsOptional()
  @IsString()
  blockHash?: string;

  @ApiProperty({
    description: 'The transaction number in the block',
  })
  @IsOptional()
  @IsString()
  txIndex?: string;

  @ApiProperty({
    description: 'The hash of the transaction',
  })
  @IsOptional()
  @IsString()
  txHash?: string;

  constructor(model: OfflineTxModel) {
    Object.assign(this, model);
  }
}
