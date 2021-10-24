import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';

describe('RelayerAccountsService', () => {
  let service: RelayerAccountsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RelayerAccountsService],
    }).compile();

    service = module.get<RelayerAccountsService>(RelayerAccountsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw BadRequestException if signer is not found', () => {
    let error;
    try {
      service.findAddressByDid('notAlice');
    } catch (err) {
      error = err;
    }
    expect(error).toBeInstanceOf(BadRequestException);
  });

  it('should return the address if set', () => {
    const address = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
    service.setAddress('alice', address);
    expect(service.findAddressByDid('alice')).toEqual(address);
  });
});
