import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

import { IsDid } from '~/common/decorators/validation';
import { PaginatedParamsDto } from '~/common/dto/paginated-params.dto';

export class GetCustomClaimTypesDto extends PaginatedParamsDto {
  @ApiPropertyOptional({
    description:
      'Filter CustomClaimTypes by DIDs that registered the CustomClaimType. <br /> If none specified, returns all CustomClaimTypes ordered by ID',
    type: 'string',
    isArray: true,
    example: [
      '0x0600000000000000000000000000000000000000000000000000000000000000',
      '0x0611111111111111111111111111111111111111111111111111111111111111',
    ],
  })
  @IsOptional()
  @IsDid({ each: true })
  readonly dids?: string[];
}
