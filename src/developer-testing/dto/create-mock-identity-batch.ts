/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { CreateMockIdentityDto } from '~/identities/dto/create-mock-identity.dto';

export class CreateMockIdentityBatchDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'The addresses to create CDD claims for',
    type: CreateMockIdentityDto,
    isArray: true,
  })
  @Type(() => CreateMockIdentityDto)
  @IsArray()
  @ValidateNested({ each: true })
  readonly accounts: CreateMockIdentityDto[];
}
