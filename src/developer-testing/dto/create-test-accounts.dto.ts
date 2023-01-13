/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

import { CreateMockIdentityDto } from '~/developer-testing/dto/create-mock-identity.dto';

export class CreateTestAccountsDto {
  @ApiProperty({
    description:
      'The `signer` to use. The account must have CDD provider permissions, and sufficient POLYX to seed account. Defaults to the configured sudo account',
    example: 'alice',
  })
  @IsOptional()
  @IsString()
  readonly signer?: string;

  @ApiProperty({
    description: 'The addresses for which to create Identities',
    type: CreateMockIdentityDto,
    isArray: true,
  })
  @Type(() => CreateMockIdentityDto)
  @IsArray()
  @ValidateNested({ each: true })
  readonly accounts: CreateMockIdentityDto[];
}
