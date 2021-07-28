import { Instruction } from '@polymathnetwork/polymesh-sdk/types';

import { InstructionModel } from '~/settlements/model/instruction.model';
import { LegModel } from '~/settlements/model/leg.model';

export async function createInstructionModel(instruction: Instruction): Promise<InstructionModel> {
  const [details, legsResultSet, instructionStatus] = await Promise.all([
    instruction.details(),
    instruction.getLegs(),
    instruction.getStatus(),
  ]);

  let eventIdentifier;
  if ('eventIdentifier' in instructionStatus) {
    eventIdentifier = instructionStatus.eventIdentifier;
  }

  return new InstructionModel({
    ...details,
    legs:
      legsResultSet.data?.map(
        ({ from, to, amount, token: asset }) => new LegModel({ from, to, amount, asset })
      ) || [],
    eventIdentifier,
  });
}
