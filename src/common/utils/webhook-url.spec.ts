/* eslint-disable import/first */
const mockLookup = jest.fn();

import { AppValidationError } from '~/common/errors';
import { assertWebhookUrlAllowed, isBlockedAddress } from '~/common/utils/webhook-url';

jest.mock('dns/promises', () => ({
  ...jest.requireActual('dns/promises'),
  lookup: mockLookup,
}));

describe('webhook-url', () => {
  afterEach(() => {
    mockLookup.mockReset();
  });

  describe('isBlockedAddress', () => {
    it.each([
      '0.0.0.0',
      '10.1.2.3',
      '100.64.0.1',
      '100.127.255.255',
      '127.0.0.1',
      '127.10.0.1',
      '169.254.169.254',
      '172.16.0.1',
      '172.31.255.255',
      '192.0.0.1',
      '192.168.1.1',
      '198.18.0.1',
      '224.0.0.1',
      '255.255.255.255',
      '::',
      '::1',
      'fc00::1',
      'fd12:3456::1',
      'fe80::1',
      'febf::1',
      'ff02::1',
      '::ffff:127.0.0.1',
      '::ffff:7f00:1',
      '::ffff:169.254.169.254',
      '::ffff:a9fe:a9fe',
      '::ffff:10.0.0.1',
      '::127.0.0.1',
    ])('should block %s', address => {
      expect(isBlockedAddress(address)).toBe(true);
    });

    it.each([
      '8.8.8.8',
      '93.184.216.34',
      '100.128.0.1',
      '172.32.0.1',
      '2606:4700:4700::1111',
      '::ffff:8.8.8.8',
      '::ffff:808:808',
    ])('should allow %s', address => {
      expect(isBlockedAddress(address)).toBe(false);
    });
  });

  describe('assertWebhookUrlAllowed', () => {
    it('should resolve for a public host', async () => {
      mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);

      await expect(assertWebhookUrlAllowed('https://example.com/hook')).resolves.toBeUndefined();
      expect(mockLookup).toHaveBeenCalledWith('example.com', { all: true, verbatim: true });
    });

    it('should reject a host that resolves to a private address', async () => {
      mockLookup.mockResolvedValue([
        { address: '93.184.216.34', family: 4 },
        { address: '10.0.0.5', family: 4 },
      ]);

      await expect(assertWebhookUrlAllowed('https://internal.example.com')).rejects.toThrow(
        AppValidationError
      );
    });

    it('should reject IP literals in blocked ranges without a DNS lookup', async () => {
      await expect(
        assertWebhookUrlAllowed('http://169.254.169.254/latest/meta-data')
      ).rejects.toThrow(AppValidationError);
      await expect(assertWebhookUrlAllowed('http://[::1]:3000/')).rejects.toThrow(
        AppValidationError
      );
      await expect(assertWebhookUrlAllowed('http://[::ffff:127.0.0.1]/')).rejects.toThrow(
        AppValidationError
      );

      expect(mockLookup).not.toHaveBeenCalled();
    });

    it('should reject non http(s) protocols and invalid URLs', async () => {
      await expect(assertWebhookUrlAllowed('file:///etc/passwd')).rejects.toThrow(
        AppValidationError
      );
      await expect(assertWebhookUrlAllowed('gopher://example.com')).rejects.toThrow(
        AppValidationError
      );
      await expect(assertWebhookUrlAllowed('not a url')).rejects.toThrow(AppValidationError);
    });

    it('should reject a host that does not resolve to any address', async () => {
      mockLookup.mockResolvedValue([]);

      await expect(assertWebhookUrlAllowed('https://example.com')).rejects.toThrow(
        AppValidationError
      );
    });

    it('should propagate DNS lookup failures', async () => {
      mockLookup.mockRejectedValue(new Error('ENOTFOUND'));

      await expect(assertWebhookUrlAllowed('https://nope.invalid')).rejects.toThrow('ENOTFOUND');
    });

    it('should skip the address check when private addresses are allowed', async () => {
      await expect(
        assertWebhookUrlAllowed('http://localhost:3000/hook', true)
      ).resolves.toBeUndefined();
      expect(mockLookup).not.toHaveBeenCalled();

      await expect(assertWebhookUrlAllowed('file:///etc/passwd', true)).rejects.toThrow(
        AppValidationError
      );
    });
  });
});
