/* istanbul ignore file */

import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { TransferRestrictionBaseDto } from '~/assets/dto/transfer-restrictions/transfer-restriction-base.dto';
import { TransferRestrictionClaimCountInputDto } from '~/assets/dto/transfer-restrictions/transfer-restriction-claim-count-input.dto';
import { TransferRestrictionClaimPercentageInputDto } from '~/assets/dto/transfer-restrictions/transfer-restriction-claim-percentage-input.dto';
import { TransferRestrictionCountInputDto } from '~/assets/dto/transfer-restrictions/transfer-restriction-count-input.dto';
import { TransferRestrictionPercentageInputDto } from '~/assets/dto/transfer-restrictions/transfer-restriction-percentage-input.dto';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

@ApiExtraModels(
  TransferRestrictionCountInputDto,
  TransferRestrictionPercentageInputDto,
  TransferRestrictionClaimCountInputDto,
  TransferRestrictionClaimPercentageInputDto
)
export class SetTransferRestrictionsDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'Transfer restrictions to set',
    type: 'array',
    items: {
      oneOf: [
        { $ref: '#/components/schemas/TransferRestrictionCountInputDto' },
        { $ref: '#/components/schemas/TransferRestrictionPercentageInputDto' },
        { $ref: '#/components/schemas/TransferRestrictionClaimCountInputDto' },
        { $ref: '#/components/schemas/TransferRestrictionClaimPercentageInputDto' },
      ],
    },
    example: [
      {
        type: 'Count',
        count: '100',
      },
      {
        type: 'Percentage',
        percentage: '50',
      },
      {
        type: 'ClaimCount',
        issuer: '0x0600000000000000000000000000000000000000000000000000000000000000',
        claim: {
          type: 'Accredited',
          accredited: true,
        },
        min: '1',
        max: '10',
      },
      {
        type: 'ClaimPercentage',
        issuer: '0x0600000000000000000000000000000000000000000000000000000000000000',
        claim: {
          type: 'Accredited',
          accredited: true,
        },
        min: '1',
        max: '10',
      },
    ],
  })
  @ValidateNested({ each: true })
  @Type(() => TransferRestrictionBaseDto, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        { value: TransferRestrictionCountInputDto, name: 'Count' },
        { value: TransferRestrictionPercentageInputDto, name: 'Percentage' },
        { value: TransferRestrictionClaimCountInputDto, name: 'ClaimCount' },
        { value: TransferRestrictionClaimPercentageInputDto, name: 'ClaimPercentage' },
      ],
    },
  })
  readonly restrictions: (
    | TransferRestrictionCountInputDto
    | TransferRestrictionPercentageInputDto
    | TransferRestrictionClaimCountInputDto
    | TransferRestrictionClaimPercentageInputDto
  )[];
}
