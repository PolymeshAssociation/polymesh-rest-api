/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { SignerType } from '@polymathnetwork/polymesh-sdk/types';
import { IsEnum } from 'class-validator';

export class SignerTypeDto {
  @ApiProperty({
    description: 'Type of the Signer',
    enum: SignerType,
    type: 'string',
    example: SignerType.Account,
  })
  @IsEnum(SignerType)
  readonly signerType: SignerType;
}
