/* istanbul ignore file */

import { ApiExtraModels } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { TransferRestrictionBaseDto } from '~/assets/dto/transfer-restrictions/transfer-restriction-base.dto';
import { TransferRestrictionClaimCountInputDto } from '~/assets/dto/transfer-restrictions/transfer-restriction-claim-count-input.dto';
import { TransferRestrictionClaimPercentageInputDto } from '~/assets/dto/transfer-restrictions/transfer-restriction-claim-percentage-input.dto';
import { TransferRestrictionCountInputDto } from '~/assets/dto/transfer-restrictions/transfer-restriction-count-input.dto';
import { TransferRestrictionPercentageInputDto } from '~/assets/dto/transfer-restrictions/transfer-restriction-percentage-input.dto';
import { ApiPropertyOneOf } from '~/common/decorators';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

@ApiExtraModels(
  TransferRestrictionCountInputDto,
  TransferRestrictionPercentageInputDto,
  TransferRestrictionClaimCountInputDto,
  TransferRestrictionClaimPercentageInputDto
)
export class SetTransferRestrictionsDto extends TransactionBaseDto {
  @ApiPropertyOneOf({
    description: 'Transfer restrictions to set',
    isArray: true,
    union: [
      TransferRestrictionCountInputDto,
      TransferRestrictionPercentageInputDto,
      TransferRestrictionClaimCountInputDto,
      TransferRestrictionClaimPercentageInputDto,
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
