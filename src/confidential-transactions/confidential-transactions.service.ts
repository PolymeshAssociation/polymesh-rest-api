import { Injectable } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  ConfidentialAffirmParty,
  ConfidentialTransaction,
  ConfidentialVenue,
  Identity,
} from '@polymeshassociation/polymesh-sdk/types';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { AppValidationError } from '~/common/errors';
import { extractTxBase, ServiceReturn } from '~/common/utils';
import { ConfidentialAccountsService } from '~/confidential-accounts/confidential-accounts.service';
import { createConfidentialTransactionModel } from '~/confidential-transactions/confidential-transactions.util';
import { CreateConfidentialTransactionDto } from '~/confidential-transactions/dto/create-confidential-transaction.dto';
import { ObserverAffirmConfidentialTransactionDto } from '~/confidential-transactions/dto/observer-affirm-confidential-transaction.dto';
import { SenderAffirmConfidentialTransactionDto } from '~/confidential-transactions/dto/sender-affirm-confidential-transaction.dto copy';
import { IdentitiesService } from '~/identities/identities.service';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { ProofServerService } from '~/proof-server/proof-server.service';
import { TransactionsService } from '~/transactions/transactions.service';
import { handleSdkError } from '~/transactions/transactions.util';

@Injectable()
export class ConfidentialTransactionsService {
  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly transactionsService: TransactionsService,
    private readonly confidentialAccountsService: ConfidentialAccountsService,
    private readonly proofServerService: ProofServerService,
    private readonly identitiesService: IdentitiesService
  ) {}

  public async findOne(id: BigNumber): Promise<ConfidentialTransaction> {
    return await this.polymeshService.polymeshApi.confidentialSettlements
      .getTransaction({ id })
      .catch(error => {
        throw handleSdkError(error);
      });
  }

  public async findVenue(id: BigNumber): Promise<ConfidentialVenue> {
    return await this.polymeshService.polymeshApi.confidentialSettlements
      .getVenue({ id })
      .catch(error => {
        throw handleSdkError(error);
      });
  }

  public async getVenueCreator(id: BigNumber): Promise<Identity> {
    const venue = await this.findVenue(id);
    return venue.creator();
  }

  public async createConfidentialVenue(
    baseParams: TransactionBaseDto
  ): ServiceReturn<ConfidentialVenue> {
    const createVenue = this.polymeshService.polymeshApi.confidentialSettlements.createVenue;
    return this.transactionsService.submit(createVenue, {}, baseParams);
  }

  public async createConfidentialTransaction(
    venueId: BigNumber,
    createConfidentialTransactionDto: CreateConfidentialTransactionDto
  ): ServiceReturn<ConfidentialTransaction> {
    const venue = await this.findVenue(venueId);

    const { base, args } = extractTxBase(createConfidentialTransactionDto);

    return this.transactionsService.submit(venue.addTransaction, args, base);
  }

  public async observerAffirmLeg(
    transactionId: BigNumber,
    body: ObserverAffirmConfidentialTransactionDto
  ): ServiceReturn<ConfidentialTransaction> {
    const transaction = await this.findOne(transactionId);

    const { base, args } = extractTxBase(body);

    return this.transactionsService.submit(transaction.affirmLeg, args, base);
  }

  public async senderAffirmLeg(
    transactionId: BigNumber,
    body: SenderAffirmConfidentialTransactionDto
  ): ServiceReturn<ConfidentialTransaction> {
    const tx = await this.findOne(transactionId);

    const transaction = await createConfidentialTransactionModel(tx);

    const { base, args } = extractTxBase(body);

    const { legId, legAmounts } = args;

    if (legId.gte(transaction.legs.length)) {
      throw new AppValidationError('Invalid leg ID received');
    }

    const { receiver, sender, assetAuditors } = transaction.legs[legId.toNumber()];

    const senderConfidentialAccount = await this.confidentialAccountsService.findOne(
      sender.publicKey
    );

    const proofs = [];

    for (const legAmount of legAmounts) {
      const { amount, confidentialAsset } = legAmount;
      const assetAuditor = assetAuditors.find(({ asset }) => asset.id === confidentialAsset);

      if (!assetAuditor) {
        throw new AppValidationError('Asset not found in the leg');
      }

      const encryptedBalance = await senderConfidentialAccount.getBalance({
        asset: confidentialAsset,
      });

      const proof = await this.proofServerService.generateSenderProof(sender.publicKey, {
        amount: amount.toNumber(),
        auditors: assetAuditor.auditors.map(({ publicKey }) => publicKey),
        receiver: receiver.publicKey,
        encrypted_balance: encryptedBalance,
      });

      proofs.push({ asset: confidentialAsset, proof });
    }

    return this.transactionsService.submit(
      tx.affirmLeg,
      {
        legId,
        party: ConfidentialAffirmParty.Sender,
        proofs,
      },
      base
    );
  }

  public async rejectTransaction(
    transactionId: BigNumber,
    base: TransactionBaseDto
  ): ServiceReturn<ConfidentialTransaction> {
    const transaction = await this.findOne(transactionId);

    return this.transactionsService.submit(transaction.reject, {}, base);
  }

  public async executeTransaction(
    transactionId: BigNumber,
    base: TransactionBaseDto
  ): ServiceReturn<ConfidentialTransaction> {
    const transaction = await this.findOne(transactionId);

    return this.transactionsService.submit(transaction.execute, {}, base);
  }

  public async getInvolvedParties(transactionId: BigNumber): Promise<Identity[]> {
    const transaction = await this.findOne(transactionId);

    return transaction.getInvolvedParties();
  }

  public async findVenuesByOwner(did: string): Promise<ConfidentialVenue[]> {
    const identity = await this.identitiesService.findOne(did);

    return identity.getConfidentialVenues();
  }
}
