import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Account } from '@polymathnetwork/polymesh-sdk/internal';
import { stringUpperFirst } from '@polymathnetwork/polymesh-sdk/node_modules/@polkadot/util';
import { Identity, Permissions, Signer } from '@polymathnetwork/polymesh-sdk/types';
import { map, snakeCase, uniq } from 'lodash';

import { AccountModel } from '~/identities/models/account.model';
import { IdentityModel } from '~/identities/models/identity.model';
import { SecondaryKeyModel } from '~/identities/models/secondary-key.model';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { PortfoliosService } from '~/portfolios/portfolios.service';

@Injectable()
export class IdentitiesService {
  private readonly logger = new Logger(IdentitiesService.name);

  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly portfoliosService: PortfoliosService
  ) {}

  /**
   * Method to get identity for a specific did
   */
  public async findOne(did: string): Promise<Identity> {
    const {
      polymeshService: { polymeshApi },
    } = this;

    const identity = polymeshApi.getIdentity({ did });
    const isValid = await polymeshApi.isIdentityValid({ identity });

    if (!isValid) {
      this.logger.error(`No valid identity found for did "${did}"`);
      throw new NotFoundException(`There is no Identity with DID "${did}"`);
    }

    return identity;
  }

  /**
   * Method to parse identity from SDK
   * Skipping test cases as this would be replaced after serialization
   */
  /** istanbul ignore next */
  public async parseIdentity(identity: Identity): Promise<IdentityModel> {
    const identityModel = new IdentityModel();
    identityModel.primaryKey = await identity.getPrimaryKey();
    identityModel.secondaryKeysFrozen = await identity.areSecondaryKeysFrozen();
    const secondaryKeys = await identity.getSecondaryKeys();
    if (secondaryKeys?.length > 0) {
      identityModel.secondaryKeys = [];
      for (const sk of secondaryKeys) {
        const secondaryKey = new SecondaryKeyModel();
        secondaryKey.signer = this.parseSigner(sk.signer);
        secondaryKey.permissions = await this.permissionsToMeshPermissions(sk.permissions);
        identityModel.secondaryKeys.push(secondaryKey);
      }
    }
    return identityModel;
  }

  /**
   * Method to parse signer based on account/identity
   * Skipping test cases as this would be replaced after serialization
   */
  /** istanbul ignore next */
  public parseSigner(signer: Signer) {
    if (signer instanceof Account) {
      const accountDto = new AccountModel();
      accountDto.address = signer.address;
      return accountDto;
    }
    const identityDto = new IdentityModel();
    identityDto.did = signer.did;
    return identityDto;
  }

  /**
   * Method to convert permission to mesh permissions
   * Skipping test cases as this would be replaced after serialization
   */
  /** istanbul ignore next */
  public async permissionsToMeshPermissions(permissions: Permissions) {
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
