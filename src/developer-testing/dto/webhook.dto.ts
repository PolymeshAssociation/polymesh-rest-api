/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class WebHookDto {
  @ApiProperty({
    description: 'some text to send',
    type: 'string',
    example: '1',
  })
  @IsString()
  readonly text: string;

  constructor(dto: WebHookDto) {
    Object.assign(this, dto);
  }
}
