import { PickType } from '@nestjs/swagger';

import { AccountModel } from '~/identities/models/account.model';

export class AccountDataModel extends PickType(AccountModel, ['address'] as const) {}
