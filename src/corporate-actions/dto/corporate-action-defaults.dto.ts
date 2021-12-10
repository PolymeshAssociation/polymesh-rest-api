/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Type } from 'class-transformer';
import { ValidateIf, ValidateNested } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { SignerDto } from '~/common/dto/signer.dto';
import { CorporateActionTargetsDto } from '~/corporate-actions/dto/corporate-action-targets.dto';
import { TaxWithholdingDto } from '~/corporate-actions/dto/tax-withholding.dto';

export class CorporateActionDefaultsDto extends SignerDto {
  @ApiPropertyOptional({
    description: 'Identities that will be affected by the Corporate Actions',
    type: CorporateActionTargetsDto,
  })
  @ValidateIf(
    ({ targets, defaultTaxWithholding, taxWithholdings }: CorporateActionDefaultsDto) =>
      !!targets || (!taxWithholdings && !defaultTaxWithholding)
  )
  @ValidateNested()
  @Type(() => CorporateActionTargetsDto)
  readonly targets?: CorporateActionTargetsDto;

  @ApiPropertyOptional({
    description:
      "Tax withholding percentage (0-100) that applies to Identities that don't have a specific percentage assigned to them",
    type: 'string',
    example: '25',
  })
  @ValidateIf(
    ({ targets, defaultTaxWithholding, taxWithholdings }: CorporateActionDefaultsDto) =>
      !!defaultTaxWithholding || (!targets && !taxWithholdings)
  )
  @ToBigNumber()
  @IsBigNumber()
  readonly defaultTaxWithholding?: BigNumber;

  @ApiPropertyOptional({
    description:
      'List of Identities and the specific tax withholding percentage that should apply to them. This takes precedence over `defaultTaxWithholding`',
    type: TaxWithholdingDto,
    isArray: true,
  })
  @ValidateIf(
    ({ targets, defaultTaxWithholding, taxWithholdings }: CorporateActionDefaultsDto) =>
      !!taxWithholdings || (!targets && !defaultTaxWithholding)
  )
  @ValidateNested({ each: true })
  @Type(() => TaxWithholdingDto)
  readonly taxWithholdings?: TaxWithholdingDto[];
}
