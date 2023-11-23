import { ApiPropertyOptional } from '@nestjs/swagger';

import { CustomClaimTypeModel } from '~/claims/models/custom-claim-type.model';

export class CustomClaimTypeWithDid extends CustomClaimTypeModel {
  @ApiPropertyOptional({
    type: 'string',
    description: 'The DID of identity that registered the CustomClaimType',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  readonly did?: string;

  constructor(model: CustomClaimTypeWithDid) {
    super(model);
    this.did = model.did;
  }
}
