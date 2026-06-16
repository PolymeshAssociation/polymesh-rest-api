/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

import { AssetHolderDto } from '~/common/dto/asset-holder.dto';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';
import { OffChainAffirmationReceiptDto } from '~/settlements/dto/offchain-affirmation-receipt.dto';

export class AffirmInstructionDto extends TransactionBaseDto {
  @ApiPropertyOptional({
    description:
      'List of asset holders (accounts or portfolios) that the signer controls and wants to affirm the instruction',
    type: () => AssetHolderDto,
    isArray: true,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AssetHolderDto)
  readonly holders?: AssetHolderDto[];

  @ApiPropertyOptional({
    description:
      'Deprecated: use `holders` instead. List of portfolios that the signer controls and wants to affirm the instruction',
    type: () => PortfolioDto,
    isArray: true,
    deprecated: true,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PortfolioDto)
  readonly portfolios?: PortfolioDto[];

  @ApiPropertyOptional({
    description:
      'List of off chain receipts required for affirming off chain legs(if any) in the instruction',
    type: () => OffChainAffirmationReceiptDto,
    isArray: true,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => OffChainAffirmationReceiptDto)
  readonly receipts?: OffChainAffirmationReceiptDto[];
}
