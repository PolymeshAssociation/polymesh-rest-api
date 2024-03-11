/* istanbul ignore file */
import { OmitType } from '@nestjs/swagger';

import { RegisterIdentityDto } from '~/identities/dto/register-identity.dto';

export class RotatePrimaryKeyParamsDto extends OmitType(RegisterIdentityDto, [
  'secondaryAccounts',
  'createCdd',
] as const) {}
