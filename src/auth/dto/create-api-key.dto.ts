/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({
    description: 'The user to create the api key for',
    example: '1',
    type: 'string',
  })
  @IsString()
  readonly userId: string;
}
