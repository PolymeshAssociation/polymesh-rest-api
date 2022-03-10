/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsOptional } from 'class-validator';

import { IsDid } from '~/common/decorators/validation';
import { SignerDto } from '~/common/dto/signer.dto';

export class TransferTickerOwnershipDto extends SignerDto {
  @ApiProperty({
    type: 'string',
    description: 'DID of the target Identity',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsDid()
  readonly target: string;

  @ApiPropertyOptional({
    description: 'Date at which the authorization request for transfer expires',
    example: new Date('05/23/2021').toISOString(),
    type: 'string',
  })
  @IsOptional()
  @IsDate()
  readonly expiry?: Date;
}
