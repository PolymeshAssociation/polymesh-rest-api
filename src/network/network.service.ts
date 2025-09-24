import { Injectable } from '@nestjs/common';
import { hexStripPrefix } from '@polkadot/util';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { ProtocolFees } from '@polymeshassociation/polymesh-sdk/api/client/types';
import { Account, ExtrinsicDataWithFees, TxTag } from '@polymeshassociation/polymesh-sdk/types';

import { MiddlewareMetadataModel } from '~/network/models/middleware-metadata.model';
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

  public async getTreasuryBalance(): Promise<BigNumber> {
    return this.polymeshService.polymeshApi.network.getTreasuryBalance();
  }

  public async getProtocolFees(tags: TxTag[], blockHash?: string): Promise<ProtocolFees[]> {
    const args = blockHash ? { tags, blockHash } : { tags };

    return this.polymeshService.polymeshApi.network.getProtocolFees(args);
  }

  public getTransactionByHash(hash: string): Promise<ExtrinsicDataWithFees | null> {
    return this.polymeshService.polymeshApi.network.getTransactionByHash({
      txHash: hexStripPrefix(hash),
    });
  }

  public async submitTransaction(transaction: TransactionDto): Promise<SubmitResultModel> {
    const { signature, ...txPayload } = transaction;

    const result = await this.polymeshService.polymeshApi.network.submitTransaction(
      { ...txPayload, multiSig: null },
      signature
    );

    return new SubmitResultModel(result);
  }

  public async getMiddlewareMetadata(): Promise<MiddlewareMetadataModel | null> {
    return this.polymeshService.polymeshApi.network.getMiddlewareMetadata();
  }
}
