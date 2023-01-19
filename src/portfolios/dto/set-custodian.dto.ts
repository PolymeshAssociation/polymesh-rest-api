/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsOptional } from 'class-validator';

import { IsDid } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class SetCustodianDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'Th DID of identity to be set as custodian',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsDid()
  readonly target: string;

  @ApiPropertyOptional({
    description: 'Expiry date for the custody over Portfolio',
    example: new Date('05/23/2021').toISOString(),
  })
  @IsOptional()
  @IsDate()
  readonly expiry?: Date;
}
