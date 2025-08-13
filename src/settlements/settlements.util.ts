import {
  Instruction,
  InstructionStatus,
  InstructionType,
  Leg,
} from '@polymeshassociation/polymesh-sdk/types';
import { isOffChainLeg } from '@polymeshassociation/polymesh-sdk/utils';

import { EventIdentifierModel } from '~/common/models/event-identifier.model';
import { LegType } from '~/common/types';
import { isFungibleLeg } from '~/common/utils';
import { createPortfolioIdentifierModel } from '~/portfolios/portfolios.util';
import { InstructionModel } from '~/settlements/models/instruction.model';
import { LegModel } from '~/settlements/models/leg.model';
import { OffChainLegModel } from '~/settlements/models/offchain-leg.model';

export function legsToLegModel(legs: Leg[]): LegModel[] {
  if (!legs.length) {
    return [];
  }

  return legs
    .map(leg => {
      if (isOffChainLeg(leg)) {
        return new OffChainLegModel({ ...leg, type: LegType.offChain });
      }
      const {
        from: legFrom,
        to: legTo,
        asset: { id },
      } = leg;
      const from = createPortfolioIdentifierModel(legFrom);
      const to = createPortfolioIdentifierModel(legTo);

      if (isFungibleLeg(leg)) {
        const { amount } = leg;
        return new LegModel({
          type: LegType.onChain,
          asset: id,
          from,
          to,
          amount,
        });
      } else {
        // presume nft
        const { nfts } = leg;

        return new LegModel({
          type: LegType.onChain,
          asset: id,
          from,
          to,
          nfts: nfts.map(({ id: nftId }) => nftId),
        });
      }
    })
    .filter(leg => !!leg) as LegModel[];
}

export async function createInstructionModel(instruction: Instruction): Promise<InstructionModel> {
  const [details, legsResultSet, instructionStatus, mediators] = await Promise.all([
    instruction.details(),
    instruction.getLegs(),
    instruction.getStatus(),
    instruction.getMediators(),
  ]);

  const { status, createdAt, tradeDate, valueDate, venue, type, memo } = details;

  const legs = legsToLegModel(legsResultSet.data);

  let instructionModelParams: ConstructorParameters<typeof InstructionModel>[0] = {
    status,
    type,
    legs: legs || [],
    mediators: mediators.map(mediator => ({
      status: mediator.status,
      identity: mediator.identity.did,
      expiry: mediator.expiry,
    })),
  };

  if (venue !== null) {
    instructionModelParams = { ...instructionModelParams, venue: venue.id };
  }

  if (createdAt !== null) {
    instructionModelParams = { ...instructionModelParams, createdAt };
  }

  if (valueDate !== null) {
    instructionModelParams = { ...instructionModelParams, valueDate };
  }

  if (tradeDate !== null) {
    instructionModelParams = { ...instructionModelParams, tradeDate };
  }

  if (memo !== null) {
    instructionModelParams = { ...instructionModelParams, memo };
  }

  if (details.type === InstructionType.SettleOnBlock) {
    instructionModelParams = { ...instructionModelParams, endBlock: details.endBlock };
  }

  if (details.type === InstructionType.SettleManual) {
    instructionModelParams = { ...instructionModelParams, endAfterBlock: details.endAfterBlock };
  }

  if (instructionStatus.status !== InstructionStatus.Pending) {
    instructionModelParams = {
      ...instructionModelParams,
      eventIdentifier: new EventIdentifierModel(instructionStatus.eventIdentifier),
    };
  }

  return new InstructionModel(instructionModelParams);
}
