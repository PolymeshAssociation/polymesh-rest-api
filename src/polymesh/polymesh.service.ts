import { Inject, Injectable } from '@nestjs/common';
import { Polymesh } from '@polymathnetwork/polymesh-sdk';
import { POLYMESH_API } from './polymesh.consts';

@Injectable()
export class PolymeshService {
  constructor(@Inject(POLYMESH_API) public readonly polymeshApi: Polymesh) {}
}
