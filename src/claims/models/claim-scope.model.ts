/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ScopeModel } from '~/claims/models/scope.model';

export class ClaimScopeModel {
  @ApiProperty({
    description: 'The scope that has been assigned to Identity',
    nullable: true,
    type: ScopeModel,
  })
  @Type(() => ScopeModel)
  readonly scope: ScopeModel | null;

  @ApiPropertyOptional({
    type: 'string',
    description: 'The ticker to which the scope is valid for',
    example: 'TICKER',
  })
  readonly ticker?: string;

  constructor(model: ClaimScopeModel) {
    Object.assign(this, model);
  }
}
