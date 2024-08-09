import { Injectable } from '@nestjs/common';
import {
  JoinCreatorParams,
  MultiSig,
  MultiSigProposal,
} from '@polymeshassociation/polymesh-sdk/types';
import { isMultiSigAccount } from '@polymeshassociation/polymesh-sdk/utils';

import { AccountsService } from '~/accounts/accounts.service';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { AppValidationError } from '~/common/errors';
import { extractTxOptions, ServiceReturn } from '~/common/utils';
import { CreateMultiSigDto } from '~/multi-sigs/dto/create-multi-sig.dto';
import { JoinCreatorDto } from '~/multi-sigs/dto/join-creator.dto';
import { ModifyMultiSigDto } from '~/multi-sigs/dto/modify-multi-sig.dto';
import { MultiSigProposalParamsDto } from '~/multi-sigs/dto/multisig-proposal-params.dto';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { TransactionsService } from '~/transactions/transactions.service';
import { handleSdkError } from '~/transactions/transactions.util';

@Injectable()
export class MultiSigsService {
  constructor(
    private readonly accountService: AccountsService,
    private readonly polymeshService: PolymeshService,
    private readonly transactionsService: TransactionsService
  ) {}

  public async findOne(multiSigAddress: string): Promise<MultiSig> {
    const multiSig = await this.accountService.findOne(multiSigAddress).catch(error => {
      throw handleSdkError(error);
    });

    if (!isMultiSigAccount(multiSig)) {
      throw new AppValidationError(`account is not a multi sig: "${multiSigAddress}"`);
    }

    return multiSig;
  }

  public async findProposal(params: MultiSigProposalParamsDto): Promise<MultiSigProposal> {
    const { multiSigAddress, proposalId: id } = params;

    const multiSig = await this.findOne(multiSigAddress);

    return multiSig.getProposal({ id }).catch(error => {
      throw handleSdkError(error);
    });
  }

  public async create(params: CreateMultiSigDto): ServiceReturn<MultiSig> {
    const {
      options,
      args: { requiredSignatures, signers },
    } = extractTxOptions(params);

    const signerAccounts = await Promise.all(
      signers.map(address => this.accountService.findOne(address))
    );

    const createMultiSig = this.polymeshService.polymeshApi.accountManagement.createMultiSigAccount;

    return this.transactionsService.submit(
      createMultiSig,
      { signers: signerAccounts, requiredSignatures },
      options
    );
  }

  public async modify(multiSigAddress: string, params: ModifyMultiSigDto): ServiceReturn<void> {
    const {
      options,
      args: { signers },
    } = extractTxOptions(params);

    const signerAccounts = await Promise.all(
      signers.map(address =>
        this.polymeshService.polymeshApi.accountManagement.getAccount({ address })
      )
    );

    const multiSig = await this.findOne(multiSigAddress);

    return this.transactionsService.submit(multiSig.modify, { signers: signerAccounts }, options);
  }

  public async joinCreator(multiSigAddress: string, params: JoinCreatorDto): ServiceReturn<void> {
    const { options, args } = extractTxOptions(params);

    const multi = await this.findOne(multiSigAddress);

    return this.transactionsService.submit(multi.joinCreator, args as JoinCreatorParams, options);
  }

  public async approve(
    proposalParams: MultiSigProposalParamsDto,
    txParams: TransactionBaseDto
  ): ServiceReturn<void> {
    const { options } = extractTxOptions(txParams);

    const proposal = await this.findProposal(proposalParams);

    return this.transactionsService.submit(proposal.approve, {}, options);
  }

  public async reject(
    proposalParams: MultiSigProposalParamsDto,
    txParams: TransactionBaseDto
  ): ServiceReturn<void> {
    const { options } = extractTxOptions(txParams);

    const proposal = await this.findProposal(proposalParams);

    return this.transactionsService.submit(proposal.reject, {}, options);
  }
}
