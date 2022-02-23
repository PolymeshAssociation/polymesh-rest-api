import {
  Instruction,
  InstructionStatus,
  InstructionType,
} from '@polymathnetwork/polymesh-sdk/types';

import { createPortfolioIdentifierModel } from '~/portfolios/portfolios.util';
import { InstructionModel } from '~/settlements/model/instruction.model';
import { LegModel } from '~/settlements/model/leg.model';

export async function createInstructionModel(instruction: Instruction): Promise<InstructionModel> {
  const [details, legsResultSet, instructionStatus] = await Promise.all([
    instruction.details(),
    instruction.getLegs(),
    instruction.getStatus(),
  ]);

  const { status, createdAt, tradeDate, valueDate, venue, type } = details;

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

  if (details.type === InstructionType.SettleOnBlock) {
    instructionModelParams = { ...instructionModelParams, endBlock: details.endBlock };
  }

  if (instructionStatus.status !== InstructionStatus.Pending) {
    instructionModelParams = {
      ...instructionModelParams,
      eventIdentifier: instructionStatus.eventIdentifier,
    };
  }

  return new InstructionModel(instructionModelParams);
}
