import { Injectable } from '@nestjs/common';
import {
  Authorization,
  AuthorizationRequest,
  AuthorizationType,
} from '@polymathnetwork/polymesh-sdk/types';

import { AuthorizationRequestModel } from '~/authorizations/models/authorization-request.model';
import { IdentitiesService } from '~/identities/identities.service';
import { IdentityModel } from '~/identities/models/identity.model';
import { PermissionsModel } from '~/identities/models/secondary-key.model';
import { PortfolioModel } from '~/portfolios/models/portfolio.model';
import { PortfoliosService } from '~/portfolios/portfolios.service';

@Injectable()
export class AuthorizationsService {
  constructor(
    private readonly portfoliosService: PortfoliosService,
    private readonly identitiesService: IdentitiesService
  ) {}
}
