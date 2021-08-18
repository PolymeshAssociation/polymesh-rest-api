import { Injectable } from '@nestjs/common';
import { SecurityToken } from '@polymathnetwork/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { QueueResult } from '~/common/types';
import { processQueue } from '~/common/utils/utils';
import { asSetAssetRequirementsParams } from '~/compliance/compliance.util';
import { SetRulesDto } from '~/compliance/dto/set-rules.dto';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';

@Injectable()
export class ComplianceService {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly relayerAccountsService: RelayerAccountsService
  ) {}

  public async setRules(ticker: string, params: SetRulesDto): Promise<QueueResult<SecurityToken>> {
    const { signer } = params;
    const asset = await this.assetsService.findOne(ticker);
    const address = this.relayerAccountsService.findAddressByDid(signer);
    return processQueue(asset.compliance.requirements.set, asSetAssetRequirementsParams(params), {
      signer: address,
    });
  }
}
