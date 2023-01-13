/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, ValidateNested } from 'class-validator';

import { ClaimDto } from '~/claims/dto/claim.dto';
import { IsDid } from '~/common/decorators/validation';

export class ClaimTargetDto {
  @ApiProperty({
    description: 'DID of the target Identity',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsDid()
  readonly target: string;

  @ApiProperty({
    description: 'The Claim to be added, modified or removed',
    type: ClaimDto,
  })
  @ValidateNested()
  @Type(() => ClaimDto)
  claim: ClaimDto;

  @ApiPropertyOptional({
    description: 'The expiry date of the Claim',
    example: new Date('05/23/2021').toISOString(),
  })
  @IsOptional()
  @IsDate()
  expiry?: Date;
}
