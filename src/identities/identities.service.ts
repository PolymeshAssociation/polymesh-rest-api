import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Identity } from '@polymathnetwork/polymesh-sdk/types';

import { PolymeshService } from '~/polymesh/polymesh.service';

@Injectable()
export class IdentitiesService {
  private readonly logger = new Logger(IdentitiesService.name);

  constructor(private readonly polymeshService: PolymeshService) {}

  /**
   * Method to get identity for a specific did
   */
  public async findOne(did: string): Promise<Identity> {
    const {
      polymeshService: { polymeshApi },
    } = this;

    const identity = polymeshApi.getIdentity({ did });
    const isValid = await polymeshApi.isIdentityValid({ identity });

    if (!isValid) {
      this.logger.error(`No valid identity found for did "${did}"`);
      throw new NotFoundException(`There is no Identity with DID "${did}"`);
    }

    return identity;
  }
}
