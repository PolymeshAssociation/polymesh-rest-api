/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { SignerDto } from '~/common/dto/signer.dto';

export class CreatePortfolioDto extends SignerDto {
  @ApiProperty({
    description: 'The name of the Portfolio to be created',
    example: 'FOLIO-1',
  })
  @IsString()
  readonly name: string;
}
