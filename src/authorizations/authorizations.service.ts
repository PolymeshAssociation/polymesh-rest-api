import { Injectable } from '@nestjs/common';
import { stringUpperFirst } from '@polymathnetwork/polymesh-sdk/node_modules/@polkadot/util';
import {
  Authorization,
  AuthorizationRequest,
  AuthorizationType,
  Permissions,
} from '@polymathnetwork/polymesh-sdk/types';
import { map, snakeCase, uniq } from 'lodash';

import { AuthorizationRequestModel } from '~/authorizations/models/authorization-request.model';
import { IdentityModel } from '~/identities/models/identity.model';
import { PortfoliosService } from '~/portfolios/portfolios.service';

@Injectable()
export class AuthorizationsService {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  // TODO method to be removed once serialization func is built
  /* istanbul ignore next */
  async parseAuthorizationRequest(authorizationRequest: AuthorizationRequest) {
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
  getValueFromAuthorizationData(data: Authorization) {
    let value: any;
    switch (data.type) {
      case AuthorizationType.NoData:
        value = undefined;
        break;
      case AuthorizationType.JoinIdentity:
        value = this.permissionsToMeshPermissions(data.value);
        break;
      case AuthorizationType.PortfolioCustody:
        value = this.portfoliosService.portfolioToPortfolioId(data.value);
        break;
      default:
        value = data.value;
    }
    return value;
  }

  /**
   * Method to get permissions
   */
  /* istanbul ignore next */
  permissionsToMeshPermissions(permissions: Permissions) {
    const { tokens, transactions, portfolios } = permissions;

    const extrinsicDict: Record<string, string[]> = {};
    let extrinsic: { palletName: string; dispatchableNames: string[] }[] | null = null;

    if (transactions) {
      uniq(transactions)
        .sort()
        .forEach(tag => {
          const [modName, txName] = tag.split('.');

          const palletName = stringUpperFirst(modName);
          const dispatchableName = snakeCase(txName);

          const pallet = (extrinsicDict[palletName] = extrinsicDict[palletName] || []);

          pallet.push(dispatchableName);
        });

      extrinsic = map(extrinsicDict, (val, key) => ({
        palletName: key,
        dispatchableNames: val,
      }));
    }

    const value = {
      asset: tokens?.map(({ ticker }) => ticker.toString()) ?? null,
      extrinsic,
      portfolio:
        portfolios?.map(portfolio => this.portfoliosService.portfolioToPortfolioId(portfolio)) ??
        null,
    };
    return value;
  }
}
