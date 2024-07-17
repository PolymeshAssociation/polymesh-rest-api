/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SignerKeyRingType } from '@polymeshassociation/polymesh-sdk/types';
import { IsEnum, IsHexadecimal, IsOptional } from 'class-validator';

export class OffChainSignatureDto {
  @ApiProperty({
    description: 'The keyring type used to sign the off chain receipt',
    enum: SignerKeyRingType,
    example: SignerKeyRingType.Sr25519,
  })
  @IsEnum(SignerKeyRingType)
  readonly type: SignerKeyRingType;

  @ApiPropertyOptional({
    description:
      'Signature to be used to verify the receipt. If no signature is provided, a signature will be generated using the signer specified along with receipt details',
    type: 'string',
    example:
      '0x12e368f3f697aa51fabf9977244c3531059a23637d05e3122b08259d2127792dc27bc9fe1a12660c0ac74ca4bd520955901d54c76c25e747356c93161654f586',
  })
  @IsOptional()
  @IsHexadecimal()
  readonly value?: `0x${string}`;
}
