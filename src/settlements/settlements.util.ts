import {
  Instruction,
  InstructionStatus,
  InstructionType,
} from '@polymeshassociation/polymesh-sdk/types';

import { EventIdentifierModel } from '~/common/models/event-identifier.model';
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

  let instructionModelParams: ConstructorParameters<typeof InstructionModel>[0] = {
    status,
    createdAt,
    venue,
    type,
    legs:
      legsResultSet.data?.map(
        ({ from, to, amount, asset }) =>
          new LegModel({
            from: createPortfolioIdentifierModel(from),
            to: createPortfolioIdentifierModel(to),
            amount,
            asset,
          })
      ) || [],
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
