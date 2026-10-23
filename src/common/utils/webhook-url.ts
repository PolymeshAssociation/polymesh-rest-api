import { LookupAddress, LookupOptions } from 'node:dns';
import { lookup } from 'node:dns/promises';
import { Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';
import { BlockList, isIP, isIPv4, LookupFunction } from 'node:net';

import { AppValidationError } from '~/common/errors';

/**
 * Address ranges a webhook must never resolve to. Covers loopback, private, link-local (incl. cloud metadata
 *   endpoints such as 169.254.169.254), unspecified, CGNAT, multicast and other reserved/non-routable ranges
 */
const blockedAddresses = new BlockList();

(
  [
    ['0.0.0.0', 8], // "this" network / unspecified
    ['10.0.0.0', 8], // RFC1918 private
    ['100.64.0.0', 10], // CGNAT
    ['127.0.0.0', 8], // loopback
    ['169.254.0.0', 16], // link-local / cloud metadata
    ['172.16.0.0', 12], // RFC1918 private
    ['192.0.0.0', 24], // IETF protocol assignments
    ['192.168.0.0', 16], // RFC1918 private
    ['198.18.0.0', 15], // benchmarking
    ['224.0.0.0', 4], // multicast
    ['240.0.0.0', 4], // reserved, incl. broadcast
  ] as const
).forEach(([network, prefix]) => blockedAddresses.addSubnet(network, prefix, 'ipv4'));

(
  [
    ['::', 128], // unspecified
    ['::1', 128], // loopback
    ['fc00::', 7], // unique local (private)
    ['fe80::', 10], // link-local
    ['ff00::', 8], // multicast
  ] as const
).forEach(([network, prefix]) => blockedAddresses.addSubnet(network, prefix, 'ipv6'));

/**
 * Extract the IPv4 address embedded in an IPv4-mapped (`::ffff:a.b.c.d`) or IPv4-compatible (`::a.b.c.d`) IPv6 address
 */
const toEmbeddedIpv4 = (address: string): string | undefined => {
  const match = /^::(?:ffff:)?(?:(\d+\.\d+\.\d+\.\d+)|([0-9a-f]{1,4}):([0-9a-f]{1,4}))$/i.exec(
    address
  );

  if (!match) {
    return undefined;
  }

  const [, dotted, high, low] = match;

  if (dotted) {
    return dotted;
  }

  const value = (Number.parseInt(high, 16) << 16) | Number.parseInt(low, 16);

  return [24, 16, 8, 0].map(shift => (value >>> shift) & 0xff).join('.');
};

/**
 * Returns true if the IP address is in a range that webhooks are not allowed to target
 */
export const isBlockedAddress = (address: string): boolean => {
  if (isIPv4(address)) {
    return blockedAddresses.check(address, 'ipv4');
  }

  const embeddedIpv4 = toEmbeddedIpv4(address);

  if (embeddedIpv4) {
    return blockedAddresses.check(embeddedIpv4, 'ipv4');
  }

  return blockedAddresses.check(address, 'ipv6');
};

/**
 * Resolve a webhook hostname, rejecting it if any of its addresses are in a blocked range
 *
 * @throws AppValidationError if the hostname resolves to a disallowed address or to nothing
 */
const resolveAllowedAddresses = async (
  hostname: string,
  options: LookupOptions,
  allowPrivateAddresses: boolean
): Promise<LookupAddress[]> => {
  const addresses = await lookup(hostname, {
    family: options.family,
    hints: options.hints,
    all: true,
    verbatim: true,
  });

  if (!addresses.length) {
    throw new AppValidationError(`webhook URL host "${hostname}" did not resolve`);
  }

  if (!allowPrivateAddresses) {
    const blocked = addresses.find(({ address }) => isBlockedAddress(address));

    if (blocked) {
      throw new AppValidationError(
        `webhook URL host "${hostname}" resolves to a disallowed address (${blocked.address})`
      );
    }
  }

  return addresses;
};

/**
 * Create a socket `lookup` function that only hands validated addresses to the connection. Validating the address
 *   that is actually connected to (instead of a separate lookup beforehand) prevents DNS rebinding
 *
 * @param allowPrivateAddresses - skip the address check (intended for local development only)
 */
export const createWebhookLookup =
  (allowPrivateAddresses: boolean): LookupFunction =>
  (hostname, options, callback) => {
    resolveAllowedAddresses(hostname, options, allowPrivateAddresses)
      .then(addresses => {
        if (options.all) {
          callback(null, addresses);
        } else {
          const [{ address, family }] = addresses;
          callback(null, address, family);
        }
      })
      .catch(err => callback(err, ''));
  };

/**
 * Create HTTP(S) agents for webhook requests whose connections are validated by {@link createWebhookLookup}
 *
 * @note the agents only affect address resolution, the Host header and TLS servername remain the URL's hostname
 */
export const createWebhookAgents = (
  allowPrivateAddresses = false
): { httpAgent: HttpAgent; httpsAgent: HttpsAgent } => {
  const lookupFn = createWebhookLookup(allowPrivateAddresses);

  return {
    httpAgent: new HttpAgent({ lookup: lookupFn }),
    httpsAgent: new HttpsAgent({ lookup: lookupFn }),
  };
};

/**
 * Ensure a webhook URL is safe for the server to call: it must be http(s), and if its host is an IP literal
 *   (for which no DNS lookup happens on connect) the address must not be loopback, private, link-local or
 *   otherwise internal. Hostnames are validated at connect time by the agents from {@link createWebhookAgents}
 *
 * @param allowPrivateAddresses - skip the address check (intended for local development only)
 *
 * @throws AppValidationError if the URL is not allowed
 */
export const assertWebhookUrlAllowed = (
  webhookUrl: string,
  allowPrivateAddresses = false
): void => {
  let url: URL;
  try {
    url = new URL(webhookUrl);
  } catch {
    throw new AppValidationError(`webhook URL "${webhookUrl}" is not a valid URL`);
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new AppValidationError(`webhook URL protocol "${url.protocol}" is not allowed`);
  }

  // IPv6 literals are bracketed in URL hostnames
  const hostname = url.hostname.replace(/^\[(.*)\]$/, '$1');

  if (!allowPrivateAddresses && isIP(hostname) && isBlockedAddress(hostname)) {
    throw new AppValidationError(`webhook URL host "${hostname}" is a disallowed address`);
  }
};
