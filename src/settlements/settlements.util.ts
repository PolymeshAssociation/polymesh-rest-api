import {
  Instruction,
  InstructionStatus,
  InstructionType,
  Leg,
} from '@polymeshassociation/polymesh-sdk/types';

import { EventIdentifierModel } from '~/common/models/event-identifier.model';
import { isFungibleLeg, isNftLeg } from '~/common/utils';
import { createPortfolioIdentifierModel } from '~/portfolios/portfolios.util';
import { InstructionModel } from '~/settlements/models/instruction.model';
import { LegModel } from '~/settlements/models/leg.model';

export function legsToLegModel(legs: Leg[]): LegModel[] {
  if (!legs.length) {
    return [];
  }

  return legs
    .map(leg => {
      const { from: legFrom, to: legTo, asset } = leg;
      const from = createPortfolioIdentifierModel(legFrom);
      const to = createPortfolioIdentifierModel(legTo);

      if (isFungibleLeg(leg)) {
        const { amount } = leg;
        return new LegModel({
          asset,
          from,
          to,
          amount,
        });
      } else if (isNftLeg(leg)) {
        const { nfts } = leg;

        return new LegModel({
          asset,
          from,
          to,
          nfts: nfts.map(({ id }) => id),
        });
      }

      return null;
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
    createdAt,
    venue,
    type,
    legs: legs || [],
    mediators: mediators.map(mediator => ({
      status: mediator.status,
      identity: mediator.identity.did,
      expiry: mediator.expiry,
    })),
  };

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

  if (instructionStatus.status !== InstructionStatus.Pending) {
    instructionModelParams = {
      ...instructionModelParams,
      eventIdentifier: new EventIdentifierModel(instructionStatus.eventIdentifier),
    };
  }

  return new InstructionModel(instructionModelParams);
}
