/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DeleteApiKeyDto {
  @ApiProperty({
    description: 'The API key to delete',
    example: 'XsQMQRpJqI/ViSdRXEa129mjOT9eJGn3pWGQL1S7Ibw=',
    type: 'string',
  })
  @IsString()
  readonly apiKey: string;
}
