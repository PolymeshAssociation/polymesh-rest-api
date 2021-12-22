/* istanbul ignore file */

import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, ValidateNested } from 'class-validator';

import { ApiPropertyOneOf } from '~/common/decorators/swagger';
import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber, IsTicker } from '~/common/decorators/validation';
import { SignerDto } from '~/common/dto/signer.dto';
import { ToCaCheckpoint } from '~/corporate-actions/decorators/transformation';
import { IsCaCheckpoint } from '~/corporate-actions/decorators/validation';
import { CorporateActionCheckpointDto } from '~/corporate-actions/dto/corporate-action-checkpoint.dto';
import { CorporateActionTargetsDto } from '~/corporate-actions/dto/corporate-action-targets.dto';
import { TaxWithholdingDto } from '~/corporate-actions/dto/tax-withholding.dto';

@ApiExtraModels(CorporateActionCheckpointDto)
export class DividendDistributionDto extends SignerDto {
  @ApiProperty({
    description: 'Brief description of the Corporate Action',
    type: 'string',
    example: 'Corporate Action description',
  })
  @IsString()
  readonly description: string;

  @ApiPropertyOptional({
    description:
      'Date at which the issuer publicly declared the Distribution. Optional, defaults to the current date',
    type: 'string',
    example: new Date('10/14/1987').toISOString(),
  })
  @IsOptional()
  @IsDate()
  readonly declarationDate?: Date;

  @ApiPropertyOptional({
    description: 'Token holder Identities that will be affected by the Corporate Actions',
    type: CorporateActionTargetsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CorporateActionTargetsDto)
  readonly targets?: CorporateActionTargetsDto;

  @ApiPropertyOptional({
    description: 'Tax withholding percentage(0-100) of the Benefits to be held for tax purposes',
    type: 'string',
    example: '25',
  })
  @IsOptional()
  @ToBigNumber()
  @IsBigNumber()
  readonly defaultTaxWithholding?: BigNumber;

  @ApiPropertyOptional({
    description:
      'List of Identities and the specific tax withholding percentage that should apply to them. This takes precedence over `defaultTaxWithholding`',
    type: TaxWithholdingDto,
    isArray: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TaxWithholdingDto)
  readonly taxWithholdings?: TaxWithholdingDto[];

  @ApiPropertyOneOf({
    description:
      'Checkpoint to be used to calculate Dividends. If a Schedule is passed, the next Checkpoint it creates will be used. If a Date is passed, a Checkpoint will be created at that date and used',
    union: [
      CorporateActionCheckpointDto,
      { type: 'string', example: new Date('10/14/1987').toISOString() },
    ],
  })
  @ToCaCheckpoint()
  @IsCaCheckpoint()
  readonly checkpoint: CorporateActionCheckpointDto | Date;

  @ApiPropertyOptional({
    description:
      'Portfolio number from which the Dividends will be distributed. Use 0 for default Portfolio',
    type: 'string',
    example: '123',
  })
  @ToBigNumber()
  @IsBigNumber()
  readonly originPortfolio: BigNumber;

  @ApiProperty({
    description: 'Ticker of the currency in which Dividends will be distributed',
    type: 'string',
    example: 'TICKER',
  })
  @IsTicker()
  readonly currency: string;

  @ApiProperty({
    description: "Amount of `currency` to pay for each Asset holders' share",
    type: 'string',
    example: '100',
  })
  @ToBigNumber()
  @IsBigNumber()
  readonly perShare: BigNumber;

  @ApiProperty({
    description: 'Maximum amount of `currency` to be distributed',
    type: 'string',
    example: '1000',
  })
  @ToBigNumber()
  @IsBigNumber()
  readonly maxAmount: BigNumber;

  @ApiProperty({
    description: 'Date starting from which token holders can claim their dividends',
    type: 'string',
    example: new Date('10/14/1987').toISOString(),
  })
  @IsDate()
  readonly paymentDate: Date;

  @ApiPropertyOptional({
    description:
      'Date after which Dividends can no longer be claimed. Optional, defaults to never expiring',
    type: 'string',
    example: new Date('10/14/1987').toISOString(),
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  readonly expiryDate?: Date;
}
