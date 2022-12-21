/**
 * Mainnet should use `595` as the coinType, otherwise it should be `1` to indicate a test net
 * reference: https://github.com/satoshilabs/slips/blob/2a2f4c79508749f7e679a127d5a56da079b8d2d8/slip-0044.md?plain=1#L32
 */
export const determineBip44CoinType = (ss58Format: number): 595 | 1 => {
  return ss58Format === 12 ? 595 : 1;
};
