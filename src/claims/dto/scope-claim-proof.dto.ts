import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { ProofScopeIdCddIdMatchDto } from '~/claims/dto/proof-scope-id-cdd-id-match.dto';
import { ApiPropertyOneOf } from '~/common/decorators/swagger';

export class ScopeClaimProofDto {
  @ApiProperty({
    description: 'The proof scope Id of the claim',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsString()
  readonly proofScopeIdWellFormed: string;

  @ApiPropertyOneOf({
    description: 'The proof scope Id of the claim',
    union: [
      {
        type: 'string',
        example: '0x0600000000000000000000000000000000000000000000000000000000000000',
      },
      ProofScopeIdCddIdMatchDto,
    ],
  })
  readonly proofScopeIdCddIdMatch: string | ProofScopeIdCddIdMatchDto;
}
