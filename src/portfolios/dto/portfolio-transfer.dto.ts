/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { IsOptional, ValidateNested } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber, IsDid } from '~/common/decorators/validation';
import { SignerDto } from '~/common/dto/signer.dto';
import { PortfolioMovementDto } from '~/portfolios/dto/portfolio-movement.dto';

export class PortfolioTransferDto extends SignerDto {
  @ApiPropertyOptional({
    example: '123',
    description: 'ID of the Portfolio to move the Asset from. Defaults to default Portfolio',
  })
  @IsOptional()
  @IsBigNumber()
  @ToBigNumber()
  readonly from?: BigNumber;

  @ApiPropertyOptional({
    example: '123',
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
  @ValidateNested({ each: true })
  readonly items: PortfolioMovementDto[];

  @ApiPropertyOptional({
    description:
      'DID of the Owner of the Portfolio. Only needed when transfering from portfolios that are custiodied. Defaults to "signer"',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsOptional()
  @IsDid()
  readonly owner?: string;
}
