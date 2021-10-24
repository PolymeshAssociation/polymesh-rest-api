import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import vaultConfig from '~/vault/config/vault.config';

import { VaultService } from './vault.service';

const mockSignResponse = {
  data: {
    data: {
      signature:
        'vault:v1:QH5Px0maAMclSTiECDGtUyWol3zcrelWo8PyxSnSiqEjlpi5Sh3VChHPipFloq+tNZkSc5p2IzuJ4W9dAybPDA==',
    },
  },
};
const expectedSig =
  '0x00407e4fc7499a00c7254938840831ad5325a8977cdcade956a3c3f2c529d28aa1239698b94a1dd50a11cf8a9165a2afad359912739a76233b89e16f5d0326cf0c';

describe('VaultService', () => {
  let service: VaultService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forFeature(vaultConfig)],
      providers: [VaultService],
    }).compile();

    service = module.get<VaultService>(VaultService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should produce a signature', async () => {
    const payload = {
      input: Buffer.from('eyJwYXlsb2FkIjogIlNpZ24gbWUhIn0=', 'base64').toString(),
    };
    const signSpy = jest.spyOn(service.client, 'post');
    signSpy.mockResolvedValue(mockSignResponse);
    const result = await service.sign(payload, 'alice', 1);
    expect(result).toEqual({ signature: expectedSig, id: 1 });
    signSpy.mockRestore();
  });
});
