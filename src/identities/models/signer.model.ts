/* istanbul ignore file */

import { AccountModel } from '~/identities/models/account.model';
import { IdentityModel } from '~/identities/models/identity.model';

export type SignerModel = IdentityModel | AccountModel;
