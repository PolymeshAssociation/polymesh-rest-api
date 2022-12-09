import { Injectable, NotFoundException } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  ErrorCode,
  GroupedInstructions,
  Instruction,
  InstructionAffirmation,
  PortfolioLike,
  ResultSet,
  TransferBreakdown,
  Venue,
  VenueDetails,
} from '@polymeshassociation/polymesh-sdk/types';
import { isPolymeshError } from '@polymeshassociation/polymesh-sdk/utils';

import { AssetsService } from '~/assets/assets.service';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { extractTxBase, ServiceReturn } from '~/common/utils';
import { IdentitiesService } from '~/identities/identities.service';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { CreateInstructionDto } from '~/settlements/dto/create-instruction.dto';
import { CreateVenueDto } from '~/settlements/dto/create-venue.dto';
import { ModifyVenueDto } from '~/settlements/dto/modify-venue.dto';
import { TransactionsService } from '~/transactions/transactions.service';

@Injectable()
export class SettlementsService {
  constructor(
    private readonly identitiesService: IdentitiesService,
    private readonly polymeshService: PolymeshService,
    private readonly transactionsService: TransactionsService,
    private readonly assetsService: AssetsService
  ) {}

  public async findPendingInstructionsByDid(did: string): Promise<GroupedInstructions> {
    const identity = await this.identitiesService.findOne(did);

    return identity.getInstructions();
  }

  public async findInstruction(id: BigNumber): Promise<Instruction> {
    let instruction: Instruction;

    try {
      instruction = await this.polymeshService.polymeshApi.settlements.getInstruction({
        id,
      });
    } catch (err: unknown) {
      if (isPolymeshError(err)) {
        const { code } = err;

        if (code === ErrorCode.ValidationError) {
          throw new NotFoundException(`There is no Instruction with ID ${id.toString()}`);
        }
      }

      throw err;
    }

    return instruction;
  }

  public async createInstruction(
    venueId: BigNumber,
    createInstructionDto: CreateInstructionDto
  ): ServiceReturn<Instruction> {
    const { base, args } = extractTxBase(createInstructionDto);
    const venue = await this.findVenue(venueId);

    const params = {
      ...args,
      legs: args.legs.map(({ amount, asset, from, to }) => ({
        amount,
        asset,
        from: from.toPortfolioLike(),
        to: to.toPortfolioLike(),
      })),
    };

    return this.transactionsService.submit(venue.addInstruction, params, base);
  }

  public async affirmInstruction(
    id: BigNumber,
    signerDto: TransactionBaseDto
  ): ServiceReturn<Instruction> {
    const instruction = await this.findInstruction(id);

    return this.transactionsService.submit(instruction.affirm, {}, signerDto);
  }

  public async rejectInstruction(
    id: BigNumber,
    signerDto: TransactionBaseDto
  ): ServiceReturn<Instruction> {
    const instruction = await this.findInstruction(id);

    return this.transactionsService.submit(instruction.reject, {}, signerDto);
  }

  public async findVenuesByOwner(did: string): Promise<Venue[]> {
    const identity = await this.identitiesService.findOne(did);
    return identity.getVenues();
  }

  public async findVenue(id: BigNumber): Promise<Venue> {
    let venue: Venue;
    try {
      venue = await this.polymeshService.polymeshApi.settlements.getVenue({
        id,
      });
    } catch (err: unknown) {
      if (isPolymeshError(err)) {
        const { code, message } = err;

        if (code === ErrorCode.ValidationError && message.startsWith("The Venue doesn't")) {
          throw new NotFoundException(`There is no Venue with ID "${id.toString()}"`);
        }
      }

      throw err;
    }
    return venue;
  }

  public async findVenueDetails(id: BigNumber): Promise<VenueDetails> {
    const venue = await this.findVenue(id);

    return venue.details();
  }

  public async findAffirmations(
    id: BigNumber,
    size: BigNumber,
    start?: string
  ): Promise<ResultSet<InstructionAffirmation>> {
    const instruction = await this.findInstruction(id);

    return instruction.getAffirmations({ size, start });
  }

  public async createVenue(createVenueDto: CreateVenueDto): ServiceReturn<Venue> {
    const { base, args } = extractTxBase(createVenueDto);

    const method = this.polymeshService.polymeshApi.settlements.createVenue;
    return this.transactionsService.submit(method, args, base);
  }

  public async modifyVenue(
    venueId: BigNumber,
    modifyVenueDto: ModifyVenueDto
  ): ServiceReturn<void> {
    const { base, args } = extractTxBase(modifyVenueDto);
    const venue = await this.findVenue(venueId);

    return this.transactionsService.submit(venue.modify, args as Required<typeof args>, base);
  }

  public async canTransfer(
    from: PortfolioLike,
    to: PortfolioLike,
    ticker: string,
    amount: BigNumber
  ): Promise<TransferBreakdown> {
    const assetDetails = await this.assetsService.findOne(ticker);
    return assetDetails.settlements.canTransfer({ from, to, amount });
  }
}
