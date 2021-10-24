/* istanbul ignore file: non production code */

import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class RelayerAccountsService {
  private accounts: Record<string, string> = {};

  public findAddressByDid(did: string): string {
    const address = this.accounts[did];
    if (!address) {
      throw new BadRequestException(`Signer: "${did}" was not found`);
    }
    return address;
  }

  public setAddress(did: string, address: string): void {
    this.accounts[did] = address;
  }
}
