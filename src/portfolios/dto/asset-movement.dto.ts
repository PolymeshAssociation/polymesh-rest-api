/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { SignerDto } from '~/common/dto/signer.dto';
import { PortfolioMovementDto } from '~/portfolios/dto/portfolio-movement.dto';

export class AssetMovementDto extends SignerDto {
  @ApiPropertyOptional({
    example: '2',
    description: 'ID of the Portfolio to move the Asset from. Defaults to default Portfolio',
  })
  @IsOptional()
  @IsBigNumber()
  @ToBigNumber()
  readonly from?: BigNumber;

  @ApiPropertyOptional({
    example: '1',
    description: 'ID of the Portfolio to move the Asset to. Defaults to default Portfolio',
  })
  @IsOptional()
  @IsBigNumber()
  @ToBigNumber()
  readonly to?: BigNumber;

  @ApiProperty({
    description: 'List of Assets and amounts to be moved',
    isArray: true,
    type: PortfolioMovementDto,
  })
  @Type(() => PortfolioMovementDto)
  @ValidateNested({ each: true })
  readonly items: PortfolioMovementDto[];
}
