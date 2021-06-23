import { Injectable } from '@nestjs/common';

import { ResultsDto } from '~/common/dto/results.dto';
import { PolymeshService } from '~/polymesh/polymesh.service';

@Injectable()
export class SettlementsService {
  constructor(private readonly polymeshService: PolymeshService) {}

  public async findPendingInstructionsByDid(did: string): Promise<ResultsDto<string>> {
    const identity = this.polymeshService.polymeshApi.getIdentity({ did });

    const pendingInstructions = await identity.getPendingInstructions();

    return { results: pendingInstructions.map(({ id }) => id.toString()) };
  }
}
