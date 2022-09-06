/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/signer.dto';
import { PortfolioMovementDto } from '~/portfolios/dto/portfolio-movement.dto';

export class AssetMovementDto extends TransactionBaseDto {
  @ApiProperty({
    example: '2',
    description: 'ID of the Portfolio to move the Asset from. Use 0 for default Portfolio',
  })
  @IsBigNumber()
  @ToBigNumber()
  readonly from: BigNumber;

  @ApiProperty({
    example: '1',
    description: 'ID of the Portfolio to move the Asset to. Use 0 for default Portfolio',
  })
  @IsBigNumber()
  @ToBigNumber()
  readonly to: BigNumber;

  @ApiProperty({
    description: 'List of Assets and amounts to be moved',
    isArray: true,
    type: PortfolioMovementDto,
  })
  @Type(() => PortfolioMovementDto)
  @ValidateNested({ each: true })
  readonly items: PortfolioMovementDto[];
}
