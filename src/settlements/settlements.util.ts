import {
  Instruction,
  InstructionStatus,
  InstructionType,
} from '@polymeshassociation/polymesh-sdk/types';

import { EventIdentifierModel } from '~/common/models/event-identifier.model';
import { isFungibleLeg, isNftLeg } from '~/common/utils';
import { createPortfolioIdentifierModel } from '~/portfolios/portfolios.util';
import { InstructionModel } from '~/settlements/models/instruction.model';
import { LegModel } from '~/settlements/models/leg.model';

export async function createInstructionModel(instruction: Instruction): Promise<InstructionModel> {
  const [details, legsResultSet, instructionStatus] = await Promise.all([
    instruction.details(),
    instruction.getLegs(),
    instruction.getStatus(),
  ]);

  const { status, createdAt, tradeDate, valueDate, venue, type, memo } = details;

  const legs = legsResultSet.data
    ?.map(leg => {
      const { from: legFrom, to: legTo, asset } = leg;
      const from = createPortfolioIdentifierModel(legFrom);
      const to = createPortfolioIdentifierModel(legTo);

      if (isFungibleLeg(leg)) {
        console.log('is fungible');
        const { amount } = leg;
        return new LegModel({
          asset,
          from,
          to,
          amount,
        });
      } else if (isNftLeg(leg)) {
        console.log('is nft');
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
    .filter(leg => !!leg) as LegModel[]; // filters out "off chain" legs, in case they were used

  let instructionModelParams: ConstructorParameters<typeof InstructionModel>[0] = {
    status,
    createdAt,
    venue,
    type,
    legs: legs || [],
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
