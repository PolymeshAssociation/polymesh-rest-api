import { Injectable } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  Account,
  AffirmationStatus,
  AffirmInstructionParams,
  GroupedInstructions,
  Instruction,
  InstructionAffirmation,
  OffChainAffirmation,
  OffChainAffirmationReceipt,
  PortfolioLike,
  ResultSet,
  TransferBreakdown,
  Venue,
  VenueDetails,
} from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { extractTxOptions, ServiceReturn } from '~/common/utils';
import { IdentitiesService } from '~/identities/identities.service';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { AffirmAsMediatorDto } from '~/settlements/dto/affirm-as-mediator.dto';
import { AffirmInstructionDto } from '~/settlements/dto/affirm-instruction.dto';
import { CreateInstructionDto } from '~/settlements/dto/create-instruction.dto';
import { CreateVenueDto } from '~/settlements/dto/create-venue.dto';
import { ExecuteInstructionDto } from '~/settlements/dto/execute-instruction.dto';
import { ModifyVenueDto } from '~/settlements/dto/modify-venue.dto';
import { UpdateVenueSignersDto } from '~/settlements/dto/update-venue-signers.dto';
import { TransactionsService } from '~/transactions/transactions.service';
import { handleSdkError } from '~/transactions/transactions.util';

@Injectable()
export class SettlementsService {
  constructor(
    private readonly identitiesService: IdentitiesService,
    private readonly polymeshService: PolymeshService,
    private readonly transactionsService: TransactionsService,
    private readonly assetsService: AssetsService
  ) {}

  public async findGroupedInstructionsByDid(did: string): Promise<GroupedInstructions> {
    const identity = await this.identitiesService.findOne(did);

    return identity.getInstructions();
  }

  public async findInstruction(id: BigNumber): Promise<Instruction> {
    return await this.polymeshService.polymeshApi.settlements
      .getInstruction({
        id,
      })
      .catch(error => {
        throw handleSdkError(error);
      });
  }

  public async createInstruction(
    venueId: BigNumber,
    createInstructionDto: CreateInstructionDto
  ): ServiceReturn<Instruction> {
    const { options, args } = extractTxOptions(createInstructionDto);
    const venue = await this.findVenue(venueId);

    const params = {
      ...args,
      legs: args.legs.map(leg => leg.toLeg()),
    };

    return this.transactionsService.submit(venue.addInstruction, params, options);
  }

  public async findVenuesByOwner(did: string): Promise<Venue[]> {
    const identity = await this.identitiesService.findOne(did);
    return identity.getVenues();
  }

  public async findVenue(id: BigNumber): Promise<Venue> {
    return await this.polymeshService.polymeshApi.settlements
      .getVenue({
        id,
      })
      .catch(error => {
        throw handleSdkError(error);
      });
  }

  public async findVenueDetails(id: BigNumber): Promise<VenueDetails> {
    const venue = await this.findVenue(id);

    return venue.details();
  }

  public async fetchAllowedSigners(id: BigNumber): Promise<Account[]> {
    const venue = await this.findVenue(id);

    return venue.getAllowedSigners();
  }

  public async findAffirmations(
    id: BigNumber,
    size: BigNumber,
    start?: string
  ): Promise<ResultSet<InstructionAffirmation>> {
    const instruction = await this.findInstruction(id);

    return instruction.getAffirmations({ size, start });
  }

  public async fetchOffChainAffirmations(id: BigNumber): Promise<OffChainAffirmation[]> {
    const instruction = await this.findInstruction(id);

    return instruction.getOffChainAffirmations();
  }

  public async fetchOffChainAffirmationForALeg(
    id: BigNumber,
    legId: BigNumber
  ): Promise<AffirmationStatus> {
    const instruction = await this.findInstruction(id);

    return instruction.getOffChainAffirmationForLeg({ legId });
  }

  public async createVenue(createVenueDto: CreateVenueDto): ServiceReturn<Venue> {
    const { options, args } = extractTxOptions(createVenueDto);

    const method = this.polymeshService.polymeshApi.settlements.createVenue;
    return this.transactionsService.submit(method, args, options);
  }

  public async modifyVenue(
    venueId: BigNumber,
    modifyVenueDto: ModifyVenueDto
  ): ServiceReturn<void> {
    const { options, args } = extractTxOptions(modifyVenueDto);
    const venue = await this.findVenue(venueId);

    return this.transactionsService.submit(venue.modify, args as Required<typeof args>, options);
  }

  public async updateVenueSigners(
    venueId: BigNumber,
    updateVenueSignersDto: UpdateVenueSignersDto,
    addSigners: boolean
  ): ServiceReturn<void> {
    const { options, args } = extractTxOptions(updateVenueSignersDto);
    const venue = await this.findVenue(venueId);
    const method = addSigners ? venue.addSigners : venue.removeSigners;

    return this.transactionsService.submit(method, args, options);
  }

  public async canTransfer(
    from: PortfolioLike,
    to: PortfolioLike,
    ticker: string,
    transferAmount?: BigNumber,
    transferNfts?: BigNumber[]
  ): Promise<TransferBreakdown> {
    const assetDetails = await this.assetsService.findOne(ticker);
    const amount = transferAmount ?? new BigNumber(0);
    const nfts = transferNfts ?? [];
    return assetDetails.settlements.canTransfer({ from, to, amount, nfts });
  }

  public async affirmInstruction(
    id: BigNumber,
    affirmInstructionDto: AffirmInstructionDto
  ): ServiceReturn<Instruction> {
    const { options, args } = extractTxOptions(affirmInstructionDto);

    const { portfolios, receipts } = args;

    const instruction = await this.findInstruction(id);

    const params = {} as AffirmInstructionParams;

    if (portfolios) {
      params.portfolios = portfolios.map(portfolio => portfolio.toPortfolioLike());
    }

    if (receipts) {
      params.receipts = await Promise.all(
        receipts.map(receipt => {
          const {
            legId,
            uid,
            signer,
            signature: { type: signerKeyRingType, value: signatureValue },
            metadata,
          } = receipt;
          if (signatureValue) {
            return Promise.resolve(receipt as OffChainAffirmationReceipt);
          }
          return instruction.generateOffChainAffirmationReceipt({
            legId,
            uid,
            signer,
            signerKeyRingType,
            metadata,
          });
        })
      );
    }

    return this.transactionsService.submit(instruction.affirm, params, options);
  }

  public async rejectInstruction(
    id: BigNumber,
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<Instruction> {
    const { options } = extractTxOptions(transactionBaseDto);
    const instruction = await this.findInstruction(id);

    return this.transactionsService.submit(instruction.reject, {}, options);
  }

  public async executeInstruction(
    id: BigNumber,
    executeInstructionDto: ExecuteInstructionDto
  ): ServiceReturn<Instruction> {
    const { options, args } = extractTxOptions(executeInstructionDto);
    const instruction = await this.findInstruction(id);

    return this.transactionsService.submit(instruction.executeManually, args, options);
  }

  public async withdrawAffirmation(
    id: BigNumber,
    signerDto: TransactionBaseDto
  ): ServiceReturn<Instruction> {
    const { options } = extractTxOptions(signerDto);
    const instruction = await this.findInstruction(id);

    return this.transactionsService.submit(instruction.withdraw, {}, options);
  }

  public async affirmInstructionAsMediator(
    id: BigNumber,
    transactionBaseDto: AffirmAsMediatorDto
  ): ServiceReturn<Instruction> {
    const { options, args } = extractTxOptions(transactionBaseDto);
    const instruction = await this.findInstruction(id);

    return this.transactionsService.submit(instruction.affirmAsMediator, args, options);
  }

  public async rejectInstructionAsMediator(
    id: BigNumber,
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<Instruction> {
    const { options } = extractTxOptions(transactionBaseDto);
    const instruction = await this.findInstruction(id);

    return this.transactionsService.submit(instruction.rejectAsMediator, {}, options);
  }

  public async withdrawAffirmationAsMediator(
    id: BigNumber,
    signerDto: TransactionBaseDto
  ): ServiceReturn<Instruction> {
    const { options } = extractTxOptions(signerDto);
    const instruction = await this.findInstruction(id);

    return this.transactionsService.submit(instruction.withdrawAsMediator, {}, options);
  }
}
