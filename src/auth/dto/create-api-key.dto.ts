/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({
    description: 'The name of the user to create the API key for',
    example: 'Alice',
    type: 'string',
  })
  @IsString()
  readonly userName: string;
}
