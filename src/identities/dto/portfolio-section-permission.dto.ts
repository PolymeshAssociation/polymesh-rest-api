/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';

import { PermissionTypeDto } from '~/identities/dto/permission-type.dto';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';

export class PortfolioSectionPermissionDto extends PermissionTypeDto {
  @ApiProperty({
    description: 'List of Portfolios to be included or excluded in the permissions',
    isArray: true,
    type: () => PortfolioDto,
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PortfolioDto)
  readonly values: PortfolioDto[];
}
