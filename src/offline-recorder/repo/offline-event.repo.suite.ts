import { OfflineEventModel } from '~/offline-recorder/model/offline-event.model';
import { OfflineEventRepo } from '~/offline-recorder/repo/offline-event.repo';

const body = { id: 'abc', memo: 'offline suite test' };

export const testOfflineEventRepo = async (offlineRepo: OfflineEventRepo): Promise<void> => {
  let event: OfflineEventModel;

  describe('method: recordEvent', () => {
    it('should record an event', async () => {
      event = await offlineRepo.recordEvent(body);
      expect(event).toMatchSnapshot();
    });
  });
};
