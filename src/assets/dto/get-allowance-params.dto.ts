/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GetAllowanceParamsDto {
  @ApiProperty({
    description: 'Account address of the allowance owner',
    example: '5EjsqfmY4JqMSrt7YQCe3if5DK4FrG98uUwZsaXmNW7aKdNM',
  })
  @IsString()
  readonly owner: string;

  @ApiProperty({
    description: 'Account address authorized to spend the Asset',
    example: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  })
  @IsString()
  readonly spender: string;
}
