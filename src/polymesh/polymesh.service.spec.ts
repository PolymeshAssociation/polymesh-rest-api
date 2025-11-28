import { Test, TestingModule } from '@nestjs/testing';

import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { ScheduleService } from '~/schedule/schedule.service';
import { MockPolymesh } from '~/test-utils/mocks';
import { MockScheduleService } from '~/test-utils/service-mocks';
import { createExecTransactionTestSetup } from '~/test-utils/test-helpers';

describe('PolymeshService', () => {
  let service: PolymeshService;
  let mockPolymeshApi: MockPolymesh;

  let mockScheduleService: MockScheduleService;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
    mockScheduleService = new MockScheduleService();

    mockScheduleService.addInterval.mockImplementation((_, cb) => cb());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolymeshService,
        { provide: POLYMESH_API, useValue: mockPolymeshApi },
        ScheduleService,
      ],
    })
      .overrideProvider(ScheduleService)
      .useValue(mockScheduleService)
      .compile();

    service = module.get<PolymeshService>(PolymeshService);
    service.onModuleInit();
  });

  afterAll(async () => {
    await service.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should add an interval to ping the node every 10 seconds', async () => {
    expect(mockPolymeshApi.network.getLatestBlock).toHaveBeenCalledTimes(1);
    expect(mockScheduleService.addInterval).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      10000
    );
  });

  describe('execTransaction', () => {
    it('should execute a transaction and handle success', async () => {
      const { signer, tx, params, unsub, signAndSend } = createExecTransactionTestSetup();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await service.execTransaction(signer, tx as any, ...params);

      expect(tx).toHaveBeenCalledWith(...params);
      expect(signAndSend).toHaveBeenCalledWith(signer, { nonce: -1 }, expect.any(Function));
      expect(unsub).toHaveBeenCalled();
    });

    it('should handle errors in transaction execution', async () => {
      const { signer, tx, params, unsub } = createExecTransactionTestSetup('someMethod', true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(service.execTransaction(signer, tx as any, ...params)).rejects.toThrow(
        'Unable to process the request'
      );

      expect(unsub).toHaveBeenCalled();
    });

    it('should handle mockCddRegisterDid specific error', async () => {
      const { signer, tx, params } = createExecTransactionTestSetup('mockCddRegisterDid', true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(service.execTransaction(signer, tx as any, ...params)).rejects.toThrow(
        'Unable to create mock Identity. Perhaps the address is already linked to an Identity or mock CDD claims are unable to be made on the chain'
      );
    });

    it('should handle sudo specific error', async () => {
      const { signer, tx, params } = createExecTransactionTestSetup('sudo', true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(service.execTransaction(signer, tx as any, ...params)).rejects.toThrow(
        'Unable to execute a sudo transaction. Perhaps the signer lacks permission'
      );
    });

    it('should handle ExtrinsicFailed error', async () => {
      const { signer, tx, params, unsub } = createExecTransactionTestSetup();
      const receipt = {
        status: { isInBlock: true },
        findRecord: (): boolean => true,
      };
      const signAndSend = jest.fn().mockImplementation((_, __, cb) => {
        cb(receipt);
        return Promise.resolve(unsub);
      });
      tx.mockReturnValue({ signAndSend });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(service.execTransaction(signer, tx as any, ...params)).rejects.toThrow(
        'Unable to process the request'
      );
    });
  });

  describe('onModuleDestroy', () => {
    it('should call close when the module is destroyed', async () => {
      const closeSpy = jest.spyOn(service, 'close').mockResolvedValue(undefined);

      await service.onModuleDestroy();

      expect(closeSpy).toHaveBeenCalledTimes(1);

      closeSpy.mockRestore();
    });
  });
});
