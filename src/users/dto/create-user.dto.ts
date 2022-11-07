/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'The unique name of the user',
    example: 'Alice',
    type: 'string',
  })
  @IsString()
  @Length(3, 127)
  readonly name: string;
}
