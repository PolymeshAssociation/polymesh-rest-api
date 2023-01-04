import { OmitType } from '@nestjs/swagger';

import { ClaimModel } from '~/claims/models/claim.model';

export class PartialClaimModel extends OmitType(ClaimModel, ['claim'] as const) {}
