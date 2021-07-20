/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

class TransactionIdentifierDto {
  @ApiProperty({
    example: '0x0372a35b1ae2f622142aa8519ce70b0980fb35727fd0348d204dfa280f2f5987',
  })
  blockHash: string;

  @ApiProperty({
    example: '0xe0346b494edcca5a30b12f3ef128e54dfce412dbf5a0202b3e69c926267d1473',
  })
  transactionHash: string;

  @ApiProperty({
    description:
      'Transaction type identifier (for UI purposes). The format is <palletName>.<transactionName>',
    example: 'asset.registerTicker',
  })
  transactionTag: string;
}

export class TransactionQueueDto {
  @ApiProperty()
  transactions: TransactionIdentifierDto[];

  constructor(dto: TransactionQueueDto) {
    Object.assign(this, dto);
  }
}
