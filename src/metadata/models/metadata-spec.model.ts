/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';

export class MetadataSpecModel {
  @ApiPropertyOptional({
    description: 'URL describing the Asset metadata',
    type: 'string',
    example: 'https://www.someexample.com',
  })
  readonly url?: string;

  @ApiPropertyOptional({
    description: 'Description about the Asset metadata',
    type: 'string',
    example: 'https://www.someexample.com',
  })
  readonly description?: string;

  @ApiPropertyOptional({
    description: 'Type definition describing the metadata',
    type: 'string',
    example: 'https://www.someexample.com',
  })
  readonly typedef?: string;
}
