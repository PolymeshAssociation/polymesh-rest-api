import { Injectable, NotFoundException } from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import {
  ErrorCode,
  Instruction,
  InstructionAffirmation,
  isPolymeshError,
  PortfolioLike,
  ResultSet,
  TransferBreakdown,
  Venue,
  VenueDetails,
} from '@polymathnetwork/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { SignerDto } from '~/common/dto/signer.dto';
import { QueueResult } from '~/common/types';
import { processQueue } from '~/common/utils/utils';
import { IdentitiesService } from '~/identities/identities.service';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';
import { CreateInstructionDto } from '~/settlements/dto/create-instruction.dto';
import { CreateVenueDto } from '~/settlements/dto/create-venue.dto';
import { ModifyVenueDto } from '~/settlements/dto/modify-venue.dto';

@Injectable()
export class SettlementsService {
  constructor(
    private readonly identitiesService: IdentitiesService,
    private readonly polymeshService: PolymeshService,
    private readonly relayerAccountsService: RelayerAccountsService,
    private readonly assetsService: AssetsService
  ) {}

  public async findPendingInstructionsByDid(did: string): Promise<Instruction[]> {
    const identity = await this.identitiesService.findOne(did);

    return identity.getPendingInstructions();
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
    createInstructuionDto: CreateInstructionDto
  ): Promise<QueueResult<Instruction>> {
    const { signer, ...rest } = createInstructuionDto;

    const venue = await this.findVenue(venueId);
    const address = this.relayerAccountsService.findAddressByDid(signer);

    const params = {
      ...rest,
      legs: rest.legs.map(({ amount, asset, from, to }) => ({
        amount,
        token: asset,
        from: from.toPortfolioLike(),
        to: to.toPortfolioLike(),
      })),
    };

    return processQueue(venue.addInstruction, params, { signer: address });
  }

  public async affirmInstruction(
    id: BigNumber,
    signerDto: SignerDto
  ): Promise<QueueResult<Instruction>> {
    const { signer } = signerDto;

    const instruction = await this.findInstruction(id);

    const address = this.relayerAccountsService.findAddressByDid(signer);

    return processQueue(instruction.affirm, undefined, { signer: address });
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
    size: number,
    start?: string
  ): Promise<ResultSet<InstructionAffirmation>> {
    const instruction = await this.findInstruction(id);

    return instruction.getAffirmations({ size, start });
  }

  public async createVenue(createVenueDto: CreateVenueDto): Promise<QueueResult<Venue>> {
    const { signer, details, type } = createVenueDto;
    const params = {
      details,
      type,
    };
    const address = this.relayerAccountsService.findAddressByDid(signer);
    const identity = await this.identitiesService.findOne(signer);
    return processQueue(identity.createVenue, params, { signer: address });
  }

  public async modifyVenue(
    venueId: BigNumber,
    modifyVenueDto: ModifyVenueDto
  ): Promise<QueueResult<void>> {
    const { signer, ...rest } = modifyVenueDto;
    const venue = await this.findVenue(venueId);
    const params = rest as Required<typeof rest>;
    const address = this.relayerAccountsService.findAddressByDid(signer);
    return processQueue(venue.modify, params, { signer: address });
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
