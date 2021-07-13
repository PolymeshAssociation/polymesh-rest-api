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

  // TODO method to be removed once serialization func is built
  /* istanbul ignore next */
  async parseAuthorizationRequest(
    authorizationRequest: AuthorizationRequest
  ): Promise<AuthorizationRequestModel> {
    const request = new AuthorizationRequestModel();
    request.authId = authorizationRequest.authId;
    request.issuer = new IdentityModel();
    request.issuer.primaryKey = await authorizationRequest.issuer.getPrimaryKey();
    request.issuer.did = authorizationRequest.issuer.did;
    request.data = {
      type: authorizationRequest.data.type,
      value: this.getValueFromAuthorizationData(authorizationRequest.data),
    };
    request.expiry = authorizationRequest.expiry;
    return request;
  }

  /**
   * Method to get value against authorization type
   * @param data
   * @returns
   */
  /* istanbul ignore next */
  getValueFromAuthorizationData(
    data: Authorization
  ): string | PortfolioModel | PermissionsModel | null {
    let value;
    switch (data.type) {
      case AuthorizationType.NoData:
        value = null;
        break;
      case AuthorizationType.JoinIdentity:
        value = this.identitiesService.permissionsToMeshPermissions(data.value);
        break;
      case AuthorizationType.PortfolioCustody:
        value = this.portfoliosService.portfolioToPortfolioId(data.value);
        break;
      default:
        value = data.value;
    }
    return value;
  }
}
