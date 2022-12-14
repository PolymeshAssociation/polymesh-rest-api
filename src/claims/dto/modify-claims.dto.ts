/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';

import { ClaimTargetDto } from '~/claims/dto/claim-target.dto';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class ModifyClaimsDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'The type of Claim. Note that different types require different fields',
  })
  @Type(() => ClaimTargetDto)
  @IsNotEmpty()
  @ValidateNested({ each: true })
  claims: ClaimTargetDto[];
}
