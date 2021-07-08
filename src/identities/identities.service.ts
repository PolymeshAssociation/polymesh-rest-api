import { Injectable, NotFoundException } from '@nestjs/common';
import { Identity } from '@polymathnetwork/polymesh-sdk/types';

import { PolymeshService } from '~/polymesh/polymesh.service';

@Injectable()
export class IdentitiesService {
  constructor(private readonly polymeshService: PolymeshService) {}

  public async findOne(did: string): Promise<Identity> {
    const {
      polymeshService: { polymeshApi },
    } = this;

    const identity = polymeshApi.getIdentity({ did });
    const isValid = await polymeshApi.isIdentityValid({ identity });

    if (!isValid) {
      throw new NotFoundException(`There is no Identity with DID "${did}"`);
    }

    return identity;
  }
}
