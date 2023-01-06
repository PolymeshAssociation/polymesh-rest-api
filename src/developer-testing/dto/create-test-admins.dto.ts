/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import { CreateMockIdentityDto } from '~/identities/dto/create-mock-identity.dto';

export class CreateTestAdminsDto {
  @ApiProperty({
    description: 'The addresses for which to create Identities and set their POLYX balances',
    type: CreateMockIdentityDto,
    isArray: true,
  })
  @Type(() => CreateMockIdentityDto)
  @IsArray()
  @ValidateNested({ each: true })
  readonly accounts: CreateMockIdentityDto[];
}
