/* istanbul ignore file */

import { AppNotFoundError } from '~/common/errors';
import { OfflineTxModel, OfflineTxStatus } from '~/offline-submitter/models/offline-tx.model';
import { OfflineTxRepo } from '~/offline-submitter/repos/offline-tx.repo';
import { testValues } from '~/test-utils/consts';

const { offlineTx } = testValues;

export const testOfflineTxRepo = async (offlineTxRepo: OfflineTxRepo): Promise<void> => {
  let model: OfflineTxModel;

  describe('method: createTx', () => {
    it('should record the transaction request', async () => {
      const txParams = new OfflineTxModel({
        ...offlineTx,
        id: 'someTestSuiteId',
      });
      model = await offlineTxRepo.createTx({ ...txParams });
      expect(model).toMatchSnapshot();
    });
  });

  describe('method: findById', () => {
    it('should return the transaction', async () => {
      const foundModel = await offlineTxRepo.findById(model.id);

      expect(foundModel).toBeDefined();
      expect(foundModel?.id).toEqual(model.id);
    });

    it('should return undefined for a transaction not found', async () => {
      const returnedModel = await offlineTxRepo.findById('notFoundId');

      expect(returnedModel).toBeUndefined();
    });
  });

  describe('method: updateTx', () => {
    it('should update the transaction record', async () => {
      const mockSignature = '0x01';
      model.status = OfflineTxStatus.Signed;
      model.signature = mockSignature;

      await offlineTxRepo.updateTx(model.id, {
        status: OfflineTxStatus.Signed,
        signature: mockSignature,
      });

      const foundModel = await offlineTxRepo.findById(model.id);

      expect(foundModel?.status).toEqual(OfflineTxStatus.Signed);
      expect(foundModel?.signature).toEqual(mockSignature);
    });

    it('should throw an error if the transaction record is not present', async () => {
      const id = 'notFoundId';
      const expectedError = new AppNotFoundError(id, 'offlineTxModel');

      await expect(offlineTxRepo.updateTx('notFoundId', {})).rejects.toThrow(expectedError);
    });
  });
};
