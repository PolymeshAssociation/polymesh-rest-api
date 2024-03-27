import { Injectable } from '@nestjs/common';
import {
  GlobalMetadataKey,
  MetadataEntry,
  SetMetadataParams,
} from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { extractTxOptions, ServiceReturn } from '~/common/utils';
import { CreateMetadataDto } from '~/metadata/dto/create-metadata.dto';
import { MetadataParamsDto } from '~/metadata/dto/metadata-params.dto';
import { SetMetadataDto } from '~/metadata/dto/set-metadata.dto';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { TransactionsService } from '~/transactions/transactions.service';
import { handleSdkError } from '~/transactions/transactions.util';

@Injectable()
export class MetadataService {
  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly transactionsService: TransactionsService,
    private readonly assetsService: AssetsService
  ) {}

  public async findGlobalKeys(): Promise<GlobalMetadataKey[]> {
    return this.polymeshService.polymeshApi.assets.getGlobalMetadataKeys();
  }

  public async findAll(ticker: string): Promise<MetadataEntry[]> {
    const { metadata } = await this.assetsService.findOne(ticker);

    return metadata.get();
  }

  public async findOne({ ticker, type, id }: MetadataParamsDto): Promise<MetadataEntry> {
    const { metadata } = await this.assetsService.findOne(ticker);

    return await metadata.getOne({ type, id }).catch(error => {
      throw handleSdkError(error);
    });
  }

  public async create(ticker: string, params: CreateMetadataDto): ServiceReturn<MetadataEntry> {
    const { args, options } = extractTxOptions(params);

    const {
      metadata: { register },
    } = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(register, args, options);
  }

  public async setValue(
    params: MetadataParamsDto,
    body: SetMetadataDto
  ): ServiceReturn<MetadataEntry> {
    const { options, args } = extractTxOptions(body);

    const { set } = await this.findOne(params);

    return this.transactionsService.submit(set, args as SetMetadataParams, options);
  }

  public async clearValue(
    params: MetadataParamsDto,
    opts: TransactionBaseDto
  ): ServiceReturn<void> {
    const { options } = extractTxOptions(opts);
    const { clear } = await this.findOne(params);

    return this.transactionsService.submit(clear, undefined, options);
  }

  public async removeKey(params: MetadataParamsDto, opts: TransactionBaseDto): ServiceReturn<void> {
    const { options } = extractTxOptions(opts);
    const { remove } = await this.findOne(params);

    return this.transactionsService.submit(remove, undefined, options);
  }
}
