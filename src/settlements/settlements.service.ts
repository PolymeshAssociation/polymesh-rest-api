import { Injectable, NotFoundException } from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import {
  Instruction,
  InstructionStatusResult,
  isPolymeshError,
  Venue,
} from '@polymathnetwork/polymesh-sdk/types';

import { SignerDto } from '~/common/dto/signer.dto';
import { QueueResult } from '~/common/types';
import { processQueue } from '~/common/utils/utils';
import { IdentitiesService } from '~/identities/identities.service';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';
import { CreateInstructionDto } from '~/settlements/dto/create-instruction.dto';

@Injectable()
export class SettlementsService {
  constructor(
    private readonly identitiesService: IdentitiesService,
    private readonly polymeshService: PolymeshService,
    private readonly relayerAccountsService: RelayerAccountsService
  ) {}

  public async findPendingInstructionsByDid(did: string): Promise<Instruction[]> {
    const identity = await this.identitiesService.findOne(did);

    return identity.getPendingInstructions();
  }

  public async findInstruction(id: BigNumber): Promise<InstructionStatusResult> {
    let instruction: Instruction;

    try {
      instruction = await this.polymeshService.polymeshApi.settlements.getInstruction({
        id,
      });
    } catch (err: unknown) {
      if (isPolymeshError(err)) {
        const { message } = err;

        if (message.startsWith("The Instruction doesn't")) {
          throw new NotFoundException(`There is no Instruction with ID ${id.toString()}`);
        }
      }

      throw err;
    }

    return instruction.getStatus();
  }

  public async createInstruction(
    venueId: BigNumber,
    createInstructuionDto: CreateInstructionDto
  ): Promise<QueueResult<Instruction>> {
    const { signer, ...rest } = createInstructuionDto;

    let venue: Venue;

    try {
      venue = await this.polymeshService.polymeshApi.settlements.getVenue({
        id: venueId,
      });
    } catch (err: unknown) {
      if (isPolymeshError(err)) {
        const { message } = err;
        if (message.startsWith('The Venue')) {
          throw new NotFoundException(`There is no Venue with ID ${venueId.toString()}`);
        }
      }

      throw err;
    }

    const address = this.relayerAccountsService.findAddressByDid(signer);
    const params = {
      ...rest,
      legs: rest.legs.map(leg => ({
        ...leg,
        from: leg.from.toPortfolioLike(),
        to: leg.to.toPortfolioLike(),
      })),
    };

    return processQueue(venue.addInstruction, params, { signer: address });
  }

  public async affirmInstruction(
    id: BigNumber,
    signerDto: SignerDto
  ): Promise<QueueResult<Instruction>> {
    const { signer } = signerDto;

    let instruction: Instruction;

    try {
      instruction = await this.polymeshService.polymeshApi.settlements.getInstruction({
        id,
      });
    } catch (err: unknown) {
      if (isPolymeshError(err)) {
        const { message } = err;

        if (message.startsWith("The Instruction doesn't exist")) {
          throw new NotFoundException(`There is no Instruction with ID ${id.toString()}`);
        }
      }

      throw err;
    }

    const address = this.relayerAccountsService.findAddressByDid(signer);

    return processQueue(instruction.affirm, undefined, { signer: address });
  }

  public async getUserVenues(did: string): Promise<Venue[]> {
    const identity = await this.identitiesService.findOne(did);
    return identity.getVenues();
  }
}
