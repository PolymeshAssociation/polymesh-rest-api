/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RemoveApiKeyDto {
  @ApiProperty({
    description: 'The API key to remove',
    example: 'XsQMQRpJqI/ViSdRXEa129mjOT9eJGn3pWGQL1S7Ibw=',
    type: 'string',
  })
  @IsString()
  readonly apiKey: string;
}
