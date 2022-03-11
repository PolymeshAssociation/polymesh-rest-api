import { Injectable, NotFoundException } from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import {
  ErrorCode,
  Instruction,
  InstructionAffirmation,
  PortfolioLike,
  ResultSet,
  TransferBreakdown,
  Venue,
  VenueDetails,
} from '@polymathnetwork/polymesh-sdk/types';
import { isPolymeshError } from '@polymathnetwork/polymesh-sdk/utils';

import { AssetsService } from '~/assets/assets.service';
import { SignerDto } from '~/common/dto/signer.dto';
import { processQueue, QueueResult } from '~/common/utils';
import { IdentitiesService } from '~/identities/identities.service';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { CreateInstructionDto } from '~/settlements/dto/create-instruction.dto';
import { CreateVenueDto } from '~/settlements/dto/create-venue.dto';
import { ModifyVenueDto } from '~/settlements/dto/modify-venue.dto';
import { SignerService } from '~/signer/signer.service';

@Injectable()
export class SettlementsService {
  constructor(
    private readonly identitiesService: IdentitiesService,
    private readonly polymeshService: PolymeshService,
    private readonly signerService: SignerService,
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
    createInstructionDto: CreateInstructionDto
  ): Promise<QueueResult<Instruction>> {
    const { signer, ...rest } = createInstructionDto;

    const venue = await this.findVenue(venueId);
    const address = this.signerService.getAddressByHandle(signer);

    const params = {
      ...rest,
      legs: rest.legs.map(({ amount, asset, from, to }) => ({
        amount,
        asset,
        from: from.toPortfolioLike(),
        to: to.toPortfolioLike(),
      })),
    };

    return processQueue(venue.addInstruction, params, { signingAccount: address });
  }

  public async affirmInstruction(
    id: BigNumber,
    signerDto: SignerDto
  ): Promise<QueueResult<Instruction>> {
    const { signer } = signerDto;

    const instruction = await this.findInstruction(id);

    const address = this.signerService.getAddressByHandle(signer);

    return processQueue(instruction.affirm, { signingAccount: address }, {});
  }

  public async rejectInstruction(
    id: BigNumber,
    signerDto: SignerDto
  ): Promise<QueueResult<Instruction>> {
    const { signer } = signerDto;

    const instruction = await this.findInstruction(id);

    const address = this.signerService.getAddressByHandle(signer);

    return processQueue(instruction.reject, { signingAccount: address }, {});
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

  public async createVenue(createVenueDto: CreateVenueDto): Promise<QueueResult<Venue>> {
    const { signer, description, type } = createVenueDto;
    const params = {
      description,
      type,
    };
    const address = this.signerService.getAddressByHandle(signer);
    const method = this.polymeshService.polymeshApi.settlements.createVenue;
    return processQueue(method, params, { signingAccount: address });
  }

  public async modifyVenue(
    venueId: BigNumber,
    modifyVenueDto: ModifyVenueDto
  ): Promise<QueueResult<void>> {
    const { signer, ...rest } = modifyVenueDto;
    const venue = await this.findVenue(venueId);
    const params = rest as Required<typeof rest>;
    const address = this.signerService.getAddressByHandle(signer);
    return processQueue(venue.modify, params, { signingAccount: address });
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
