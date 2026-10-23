import { lookup } from 'dns/promises';
import { BlockList, isIP, isIPv4 } from 'net';

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

  const value = (parseInt(high, 16) << 16) | parseInt(low, 16);

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
 * Ensure a webhook URL is safe for the server to call: it must be http(s) and its hostname must not resolve
 *   to a loopback, private, link-local or otherwise internal address
 *
 * @param allowPrivateAddresses - skip the address check (intended for local development only)
 *
 * @throws AppValidationError if the URL is not allowed
 */
export const assertWebhookUrlAllowed = async (
  webhookUrl: string,
  allowPrivateAddresses = false
): Promise<void> => {
  let url: URL;
  try {
    url = new URL(webhookUrl);
  } catch {
    throw new AppValidationError(`webhook URL "${webhookUrl}" is not a valid URL`);
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new AppValidationError(`webhook URL protocol "${url.protocol}" is not allowed`);
  }

  if (allowPrivateAddresses) {
    return;
  }

  // IPv6 literals are bracketed in URL hostnames
  const hostname = url.hostname.replace(/^\[(.*)\]$/, '$1');

  const addresses = isIP(hostname)
    ? [{ address: hostname }]
    : await lookup(hostname, { all: true, verbatim: true });

  if (!addresses.length) {
    throw new AppValidationError(`webhook URL host "${hostname}" did not resolve`);
  }

  const blocked = addresses.find(({ address }) => isBlockedAddress(address));

  if (blocked) {
    throw new AppValidationError(
      `webhook URL host "${hostname}" resolves to a disallowed address (${blocked.address})`
    );
  }
};
