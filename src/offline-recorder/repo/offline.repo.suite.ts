import { TopicName } from '~/common/utils/amqp';
import { OfflineEventModel } from '~/offline-recorder/model/event.model';
import { OfflineRepo } from '~/offline-recorder/repo/offline.repo';

const name = TopicName.Submissions;
const body = { id: 'abc' };

export const testOfflineRepo = async (offlineRepo: OfflineRepo): Promise<void> => {
  let event: OfflineEventModel;

  describe('method: recordEvent', () => {
    it('should create a user', async () => {
      event = await offlineRepo.recordEvent(name, body);
      expect(event).toMatchSnapshot();
    });
  });
};
