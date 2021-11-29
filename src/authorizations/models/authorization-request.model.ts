/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Authorization, Identity } from '@polymathnetwork/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { FromBigNumber, FromEntity, FromEntityObject } from '~/common/decorators/transformation';
import { SignerModel } from '~/identities/models/signer.model';

export class AuthorizationRequestModel {
  @ApiProperty({
    description: 'Unique ID of the Authorization Request (used to accept/reject/cancel)',
    type: 'string',
    example: '123',
  })
  @FromBigNumber()
  readonly id: BigNumber;

  @ApiProperty({
    description:
      'Date at which the Authorization Request expires and can no longer be accepted. A null value means that the Request never expires',
    type: 'string',
    example: new Date('10/14/1987').toISOString(),
    nullable: true,
  })
  readonly expiry: Date | null;

  @ApiProperty({
    description: 'Authorization Request data corresponding to type of Authorization',
    examples: [
      {
        type: 'PortfolioCustody',
        value: {
          did: '0x0600000000000000000000000000000000000000000000000000000000000000',
          id: '1',
        },
      },
      {
        type: 'NoData',
      },
    ],
  })
  @FromEntityObject()
  readonly data: Authorization;

  @ApiProperty({
    description: 'The DID of the request issuer',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @FromEntity()
  readonly issuer: Identity;

  @ApiProperty({
    description: 'Target Identity or Account of the request',
    type: () => SignerModel,
  })
  @Type(() => SignerModel)
  readonly target: SignerModel;

  constructor(model: AuthorizationRequestModel) {
    Object.assign(this, model);
  }
}
