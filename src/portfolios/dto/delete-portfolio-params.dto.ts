/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

import { IsDid } from '~/common/decorators/validation';
import { SignerDto } from '~/common/dto/signer.dto';

export class DeletePortfolioParamsDto extends SignerDto {
  @ApiPropertyOptional({
    description: 'The DID of the Portfolio owner',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsOptional()
  @IsDid()
  readonly did: string;
}
