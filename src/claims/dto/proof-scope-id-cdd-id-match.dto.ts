import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';

export class ProofScopeIdCddIdMatchDto {
  @ApiProperty({
    type: 'string',
    isArray: true,
    required: true,
    description: 'Challenge responses',
    example: [
      '0x0600000000000000000000000000000000000000000000000000000000000000',
      '0x0700000000000000000000000000000000000000000000000000000000000000',
    ],
  })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsString({ each: true })
  readonly challengeResponses: [string, string];

  @ApiProperty({
    type: 'string',
    description: 'The subtracted expressions result',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsString()
  readonly subtractExpressionsRes: string;

  @ApiProperty({
    type: 'string',
    description: 'The blinded scope DID hash',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
    required: true,
  })
  @IsString()
  readonly blindedScopeDidHash: string;
}
