import { Inject, Injectable } from '@nestjs/common';
import { Polymesh } from '@polymathnetwork/polymesh-sdk';

import { POLYMESH_API } from './polymesh.consts';

@Injectable()
export class PolymeshService {
  private heartbeatInterval: NodeJS.Timeout;

  constructor(@Inject(POLYMESH_API) public readonly polymeshApi: Polymesh) {
    this.heartbeatInterval = setInterval(() => {
      this.polymeshApi.getLatestBlock();
    }, 10000);
  }

  /* istanbul ignore next: not worth the trouble */
  public close(): Promise<void> {
    clearInterval(this.heartbeatInterval);
    return this.polymeshApi.disconnect();
  }
}
