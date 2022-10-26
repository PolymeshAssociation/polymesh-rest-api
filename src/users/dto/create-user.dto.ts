/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'The unique name of the user',
    example: 'Alice',
    type: 'string',
  })
  @IsString()
  readonly name: string;
}
