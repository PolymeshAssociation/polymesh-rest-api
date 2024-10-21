/* istanbul ignore file */

import { ApiExtraModels, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Type } from 'class-transformer';
import { IsByteLength, IsDate, IsOptional, IsString, ValidateNested } from 'class-validator';

import { ApiPropertyOneOf } from '~/common/decorators/swagger';
import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber, IsDid } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { LegType } from '~/common/types';
import { AssetLegTypeDto } from '~/settlements/dto/asset-leg.dto';
import { LegDto } from '~/settlements/dto/leg.dto';
import { OffChainLegDto } from '~/settlements/dto/offchain-leg.dto';

@ApiExtraModels(LegDto, OffChainLegDto, AssetLegTypeDto)
export class CreateInstructionDto extends TransactionBaseDto {
  @ApiPropertyOneOf({
    description: 'Array of legs which can be either LegDto or OffChainLegDto',
    union: [LegDto, OffChainLegDto],
    isArray: true,
  })
  @ValidateNested({ each: true })
  @Type(() => AssetLegTypeDto, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        {
          value: OffChainLegDto,
          name: LegType.offChain,
        },
        {
          value: LegDto,
          name: LegType.onChain,
        },
      ],
    },
  })
  readonly legs: (LegDto | OffChainLegDto)[];

  @ApiPropertyOptional({
    description: 'Date at which the trade was agreed upon (optional, for off chain trades)',
    example: new Date('10/14/1987').toISOString(),
  })
  @IsOptional()
  @IsDate()
  readonly tradeDate?: Date;

  @ApiPropertyOptional({
    description: 'Date at which the trade was executed (optional, for off chain trades)',
    example: new Date('10/14/1987').toISOString(),
  })
  @IsOptional()
  @IsDate()
  readonly valueDate?: Date;

  @ApiPropertyOptional({
    type: 'string',
    description:
      'Block at which the Instruction will be executed. If not passed, the Instruction will be executed when all parties affirm or as soon as one party rejects',
    example: '123',
  })
  @IsOptional()
  @IsBigNumber()
  @ToBigNumber()
  readonly endBlock?: BigNumber;

  @ApiPropertyOptional({
    type: 'string',
    description:
      'Block after which the Instruction can be manually executed. If not passed, the Instruction will be executed when all parties affirm or as soon as one party rejects',
    example: '123',
  })
  @IsOptional()
  @IsBigNumber()
  @ToBigNumber()
  readonly endAfterBlock?: BigNumber;

  @ApiPropertyOptional({
    description: 'Identifier string to help differentiate instructions. Maximum 32 bytes',
    example: 'Transfer of GROWTH Asset',
  })
  @IsOptional()
  @IsString()
  @IsByteLength(0, 32)
  readonly memo?: string;

  @ApiPropertyOptional({
    description: 'Additional identities that will need to affirm that instruction',
    isArray: true,
    type: 'string',
    example: ['0x0600000000000000000000000000000000000000000000000000000000000000'],
  })
  @IsOptional()
  @IsDid({ each: true })
  readonly mediators: string[];
}
