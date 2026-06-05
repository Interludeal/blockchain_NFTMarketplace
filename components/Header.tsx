'use client'

import { useAccount, useReadContract } from 'wagmi'
import { tokenABI, tokenAddress } from '@/app/contracts'
import { ConnectWallet } from '@/components/ConnectWallet'
import { formatTokenAmount } from '@/lib/format'

export function Header() {
  const { address, isConnected } = useAccount()

  const { data: balance } = useReadContract({
    address: tokenAddress,
    abi: tokenABI,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address },
  })

  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: tokenABI,
    functionName: 'decimals',
  })

  const { data: symbol } = useReadContract({
    address: tokenAddress,
    abi: tokenABI,
    functionName: 'symbol',
  })

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">NFT Marketplace</h1>
          <p className="text-sm text-zinc-500">Sepolia 테스트넷</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {isConnected && balance !== undefined && (
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              잔액:{' '}
              {formatTokenAmount(
                balance,
                decimals ?? 18,
                symbol ?? 'TOKEN',
              )}
            </span>
          )}
          <ConnectWallet />
        </div>
      </div>
    </header>
  )
}
