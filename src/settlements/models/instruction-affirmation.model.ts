/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AffirmationStatus, Identity } from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { FromEntity } from '~/common/decorators/transformation';
import { AssetHolderModel } from '~/common/models/asset-holder.model';

export enum InstructionAffirmationPartyType {
  account = 'account',
  identity = 'identity',
}

export class InstructionAffirmationModel {
  @ApiProperty({
    description: 'The affirming party (Account or Identity)',
  })
  @Type(() => Object)
  party: AssetHolderModel | { did: string };

  @ApiProperty({
    description: 'Type of the affirming party',
    enum: InstructionAffirmationPartyType,
    example: InstructionAffirmationPartyType.identity,
  })
  partyType: InstructionAffirmationPartyType;

  @ApiPropertyOptional({
    description:
      'Deprecated: the DID of the identity affirming the Instruction. Present when party is an Identity',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
    deprecated: true,
  })
  @FromEntity()
  identity?: Identity;

  @ApiProperty({
    description: 'The current status of the Instruction',
    type: 'string',
    enum: AffirmationStatus,
    example: AffirmationStatus.Pending,
  })
  status: AffirmationStatus;

  constructor(model: InstructionAffirmationModel) {
    Object.assign(this, model);
  }
}
