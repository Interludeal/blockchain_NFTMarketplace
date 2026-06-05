import { formatUnits } from 'viem'

export function shortenAddress(address: string, chars = 4) {
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`
}

export function formatTokenAmount(
  value: bigint,
  decimals: number,
  symbol = 'TOKEN',
) {
  return `${formatUnits(value, decimals)} ${symbol}`
}
