/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { OffChainSignatureDto } from '~/settlements/dto/offchain-signature.dto';

export class OffChainAffirmationReceiptDto {
  @ApiProperty({
    description: 'Unique receipt number set by the signer for their receipts',
    type: 'string',
    example: '945',
  })
  @ToBigNumber()
  @IsBigNumber()
  readonly uid: BigNumber;

  @ApiProperty({
    description: 'Index of the off chain leg within the instruction to be affirmed',
    type: 'string',
    example: '0',
  })
  @ToBigNumber()
  @IsBigNumber()
  readonly legId: BigNumber;

  @ApiProperty({
    description:
      'Signer of this receipt. Note, this signer should be an allowed signer of the settlement venue',
    type: 'string',
    example: '5EjsqfmY4JqMSrt7YQCe3if5DK4FrG98uUwZsaXmNW7aKdNM',
  })
  @IsString()
  readonly signer: string;

  @ApiProperty({
    description: 'Signature confirming the receipt details',
    type: () => OffChainSignatureDto,
  })
  @ValidateNested()
  @Type(() => OffChainSignatureDto)
  readonly signature: OffChainSignatureDto;

  @ApiProperty({
    description: 'Metadata value that can be used to attach messages to the receipt',
    type: 'string',
    example: 'Random metadata',
  })
  @IsOptional()
  @IsString()
  readonly metadata?: string;

  constructor(dto: OffChainAffirmationReceiptDto) {
    Object.assign(this, dto);
  }
}
