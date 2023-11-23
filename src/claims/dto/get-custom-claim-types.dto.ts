import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsDid } from '~/common/decorators/validation';
import { PaginatedParamsDto } from '~/common/dto/paginated-params.dto';

export class GetCustomClaimTypesDto extends PaginatedParamsDto {
  @ApiPropertyOptional({
    description: 'The DIDs of identities that have registered the CustomClaimTypes',
    type: 'string',
    isArray: true,
    example: [
      '0x0600000000000000000000000000000000000000000000000000000000000000',
      '0x0611111111111111111111111111111111111111111111111111111111111111',
    ],
  })
  @IsDid({ each: true })
  readonly dids?: string[];
}
