import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import relayerAccountsConfig from '~/relayer-accounts/config/relayer-accounts.config';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';

describe('RelayerAccountsService', () => {
  let service: RelayerAccountsService;
  const did = '0x06'.padEnd(66, '0');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelayerAccountsService,
        {
          provide: relayerAccountsConfig.KEY,
          useValue: { [did]: '//Alice' },
        },
      ],
    }).compile();

    service = module.get<RelayerAccountsService>(RelayerAccountsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAddressByDid', () => {
    it('should throw BadRequestException if address is not found', async () => {
      const expectedError = new BadRequestException('A signer was not found by "fake"');
      let error;
      try {
        service.findAddressByDid('fake');
      } catch (err) {
        error = err;
      }

      expect(error).toEqual(expectedError);
    });

    it('should return the address if it is found', async () => {
      service.setAddress(did, '5ef');
      const address = service.findAddressByDid(did);
      expect(address).toEqual('5ef');
    });
  });
});
