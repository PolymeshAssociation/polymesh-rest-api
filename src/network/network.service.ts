import { Injectable } from '@nestjs/common';
import { hexStripPrefix } from '@polkadot/util';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Account, ExtrinsicDataWithFees } from '@polymeshassociation/polymesh-sdk/types';

import { NetworkPropertiesModel } from '~/network/models/network-properties.model';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { TransactionDto } from '~/transactions/dto/transaction.dto';
import { SubmitResultModel } from '~/transactions/models/submit-result.model';

@Injectable()
export class NetworkService {
  constructor(private readonly polymeshService: PolymeshService) {}

  public async getNetworkProperties(): Promise<NetworkPropertiesModel> {
    return this.polymeshService.polymeshApi.network.getNetworkProperties();
  }

  public async getLatestBlock(): Promise<BigNumber> {
    return this.polymeshService.polymeshApi.network.getLatestBlock();
  }

  public getTreasuryAccount(): Account {
    return this.polymeshService.polymeshApi.network.getTreasuryAccount();
  }

  public getTransactionByHash(hash: string): Promise<ExtrinsicDataWithFees | null> {
    return this.polymeshService.polymeshApi.network.getTransactionByHash({
      txHash: hexStripPrefix(hash),
    });
  }

  public async submitTransaction(transaction: TransactionDto): Promise<SubmitResultModel> {
    const { signature, ...txPayload } = transaction;

    const result = await this.polymeshService.polymeshApi.network.submitTransaction(
      txPayload,
      signature
    );

    return new SubmitResultModel(result);
  }
}
