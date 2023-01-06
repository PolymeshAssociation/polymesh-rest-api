import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';

export class ProofScopeIdCddIdMatchDto {
  @ApiProperty({
    type: 'string',
    isArray: true,
    required: true,
  })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsString({ each: true })
  readonly challengeResponses: [string, string];

  @ApiProperty({
    type: 'string',
  })
  readonly subtractExpressionsRes: string;

  @ApiProperty({
    type: 'string',
    description: 'The blinded scope DID hash',
    example: '0x060000',
    required: true,
  })
  readonly blindedScopeDidHash: string;
}
