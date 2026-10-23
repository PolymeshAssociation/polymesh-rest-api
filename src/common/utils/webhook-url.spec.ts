/* eslint-disable import/first */
const mockLookup = jest.fn();

import { LookupOptions } from 'dns';
import { Agent as HttpAgent, createServer, get, Server } from 'http';
import { AddressInfo } from 'net';

import { AppValidationError } from '~/common/errors';
import {
  assertWebhookUrlAllowed,
  createWebhookAgents,
  createWebhookLookup,
  isBlockedAddress,
} from '~/common/utils/webhook-url';

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
    it('should allow http(s) URLs with a hostname without resolving it', () => {
      expect(() => assertWebhookUrlAllowed('https://example.com/hook')).not.toThrow();
      expect(() => assertWebhookUrlAllowed('http://internal.example.com')).not.toThrow();
      expect(mockLookup).not.toHaveBeenCalled();
    });

    it('should allow public IP literals', () => {
      expect(() => assertWebhookUrlAllowed('http://93.184.216.34/hook')).not.toThrow();
      expect(() => assertWebhookUrlAllowed('http://[2606:4700:4700::1111]/')).not.toThrow();
    });

    it('should reject IP literals in blocked ranges', () => {
      expect(() => assertWebhookUrlAllowed('http://169.254.169.254/latest/meta-data')).toThrow(
        AppValidationError
      );
      expect(() => assertWebhookUrlAllowed('http://[::1]:3000/')).toThrow(AppValidationError);
      expect(() => assertWebhookUrlAllowed('http://[::ffff:127.0.0.1]/')).toThrow(
        AppValidationError
      );
    });

    it('should reject non http(s) protocols and invalid URLs', () => {
      expect(() => assertWebhookUrlAllowed('file:///etc/passwd')).toThrow(AppValidationError);
      expect(() => assertWebhookUrlAllowed('gopher://example.com')).toThrow(AppValidationError);
      expect(() => assertWebhookUrlAllowed('not a url')).toThrow(AppValidationError);
    });

    it('should skip the address check when private addresses are allowed', () => {
      expect(() => assertWebhookUrlAllowed('http://127.0.0.1:3000/hook', true)).not.toThrow();
      expect(() => assertWebhookUrlAllowed('file:///etc/passwd', true)).toThrow(AppValidationError);
    });
  });

  describe('createWebhookLookup', () => {
    const callLookup = (
      allowPrivateAddresses: boolean,
      options: LookupOptions
    ): Promise<{ err: Error | null; address: unknown; family?: number }> =>
      new Promise(resolve =>
        createWebhookLookup(allowPrivateAddresses)('example.com', options, (err, address, family) =>
          resolve({ err, address, family })
        )
      );

    it('should return a validated public address to the socket', async () => {
      mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);

      const result = await callLookup(false, { family: 0 });

      expect(result).toEqual({ err: null, address: '93.184.216.34', family: 4 });
      expect(mockLookup).toHaveBeenCalledWith('example.com', {
        family: 0,
        hints: undefined,
        all: true,
        verbatim: true,
      });
    });

    it('should return all validated addresses when requested', async () => {
      const addresses = [
        { address: '93.184.216.34', family: 4 },
        { address: '2606:2800:220:1::1', family: 6 },
      ];
      mockLookup.mockResolvedValue(addresses);

      const result = await callLookup(false, { all: true });

      expect(result).toEqual({ err: null, address: addresses, family: undefined });
    });

    it('should reject if any address is disallowed', async () => {
      mockLookup.mockResolvedValue([
        { address: '93.184.216.34', family: 4 },
        { address: '10.0.0.5', family: 4 },
      ]);

      const { err } = await callLookup(false, {});

      expect(err).toBeInstanceOf(AppValidationError);
    });

    it('should reject if the host does not resolve to any address', async () => {
      mockLookup.mockResolvedValue([]);

      const { err } = await callLookup(false, {});

      expect(err).toBeInstanceOf(AppValidationError);
    });

    it('should propagate DNS lookup failures', async () => {
      mockLookup.mockRejectedValue(new Error('ENOTFOUND'));

      const { err } = await callLookup(false, {});

      expect(err?.message).toBe('ENOTFOUND');
    });

    it('should allow private addresses when configured to', async () => {
      mockLookup.mockResolvedValue([{ address: '127.0.0.1', family: 4 }]);

      const result = await callLookup(true, {});

      expect(result).toEqual({ err: null, address: '127.0.0.1', family: 4 });
    });
  });

  describe('createWebhookAgents', () => {
    let server: Server;
    let port: number;
    let receivedHost: string | undefined;

    beforeAll(async () => {
      server = createServer((req, res) => {
        receivedHost = req.headers.host;
        res.end('ok');
      });
      await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
      ({ port } = server.address() as AddressInfo);
    });

    afterAll(async () => {
      await new Promise(resolve => server.close(resolve));
    });

    beforeEach(() => {
      receivedHost = undefined;
    });

    const request = (agent: HttpAgent): Promise<number | undefined> =>
      new Promise((resolve, reject) => {
        get(`http://rebind.example.com:${port}/hook`, { agent }, res => {
          res.resume();
          res.on('end', () => resolve(res.statusCode));
        }).on('error', reject);
      });

    it('should refuse to connect when the host resolves to a private address at connect time', async () => {
      mockLookup.mockResolvedValue([{ address: '127.0.0.1', family: 4 }]);

      const { httpAgent } = createWebhookAgents();

      await expect(request(httpAgent)).rejects.toThrow(AppValidationError);
      expect(receivedHost).toBeUndefined();
    });

    it('should connect to the validated address, keeping the original hostname as the Host header', async () => {
      mockLookup.mockResolvedValue([{ address: '127.0.0.1', family: 4 }]);

      const { httpAgent } = createWebhookAgents(true);

      await expect(request(httpAgent)).resolves.toBe(200);
      expect(receivedHost).toBe(`rebind.example.com:${port}`);
      expect(mockLookup).toHaveBeenCalledTimes(1);
    });

    it('should use the validating lookup for https connections', () => {
      const { httpsAgent } = createWebhookAgents();

      expect((httpsAgent as unknown as { options: { lookup: unknown } }).options.lookup).toEqual(
        expect.any(Function)
      );
    });
  });
});
