/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Identity } from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { FromBigNumber, FromEntity } from '~/common/decorators/transformation';
import { ConfidentialAccountModel } from '~/confidential-accounts/models/confidential-account.model';
import { IdentityModel } from '~/identities/models/identity.model';

export class ConfidentialAssetDetailsModel {
  @ApiProperty({
    description: 'The DID of the Confidential Asset owner',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @FromEntity()
  readonly owner: Identity;

  @ApiProperty({
    description: 'Custom data associated with the Confidential Asset',
    type: 'string',
    example: 'Random Data',
  })
  readonly data: string;

  @ApiProperty({
    description: 'Total supply count of the Asset',
    type: 'string',
    example: '1000',
  })
  @FromBigNumber()
  readonly totalSupply: BigNumber;

  @ApiProperty({
    description: 'Auditors configured for the Confidential Asset',
    type: ConfidentialAccountModel,
  })
  @Type(() => ConfidentialAccountModel)
  readonly auditors: ConfidentialAccountModel[];

  @ApiPropertyOptional({
    description: 'Mediators configured for the Confidential Asset',
    type: IdentityModel,
  })
  @Type(() => IdentityModel)
  readonly mediators?: IdentityModel[];

  constructor(model: ConfidentialAssetDetailsModel) {
    Object.assign(this, model);
  }
}
