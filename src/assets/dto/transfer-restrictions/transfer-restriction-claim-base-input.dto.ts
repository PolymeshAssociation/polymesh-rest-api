/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { StatAccreditedClaimDto, StatAffiliateClaimDto, StatClaimDto, StatJurisdictionClaimDto } from '~/assets/dto/stat-claim.dto';
import { TransferRestrictionBaseDto } from '~/assets/dto/transfer-restrictions/transfer-restriction-base.dto';
import { ApiPropertyOneOf } from '~/common/decorators';
import { IsDid } from '~/common/decorators/validation';

export class TransferRestrictionClaimBaseInputDto extends TransferRestrictionBaseDto {
  @ApiProperty({
    description: 'The DID of the claim issuer',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsDid()
  readonly issuer: string;

  @ApiPropertyOneOf({
    description: 'The claim associated with the transfer restriction',
    union: [StatAccreditedClaimDto, StatAffiliateClaimDto, StatJurisdictionClaimDto],
  })
  @ValidateNested()
  @Type(() => StatClaimDto, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        { value: StatAccreditedClaimDto, name: 'Accredited' },
        { value: StatAffiliateClaimDto, name: 'Affiliate' },
        { value: StatJurisdictionClaimDto, name: 'Jurisdiction' },
      ],
    },
  })
  readonly claim: StatClaimDto;
}

