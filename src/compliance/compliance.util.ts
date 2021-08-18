import { SetAssetRequirementsParams } from '@polymathnetwork/polymesh-sdk/api/procedures/setAssetRequirements';

import { ConditionDto } from '~/compliance/dto/condition.dto';
import { SetRulesDto } from '~/compliance/dto/set-rules.dto';

// helper function to help convert the payload into the SDK params
export function asSetAssetRequirementsParams(setRulesDto: SetRulesDto): SetAssetRequirementsParams {
  const requirements: ConditionDto[][] = [];
  setRulesDto.requirements.forEach(g => requirements.push(g.conditionSet));
  return { requirements } as SetAssetRequirementsParams;
}
