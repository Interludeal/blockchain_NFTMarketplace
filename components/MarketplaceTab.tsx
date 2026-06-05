'use client'

import { useMemo } from 'react'
import { useReadContract, useReadContracts } from 'wagmi'
import {
  marketplaceABI,
  marketplaceAddress,
  nftABI,
  nftAddress,
  tokenABI,
  tokenAddress,
} from '@/app/contracts'
import { NftCard } from '@/components/NftCard'

export function MarketplaceTab() {
  const { data: totalSupply } = useReadContract({
    address: nftAddress,
    abi: nftABI,
    functionName: 'totalSupply',
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

  const tokenIds = useMemo(() => {
    const count = totalSupply ? Number(totalSupply) : 0
    return Array.from({ length: count }, (_, i) => BigInt(i))
  }, [totalSupply])

  const listingContracts = useMemo(
    () =>
      tokenIds.map((id) => ({
        address: marketplaceAddress,
        abi: marketplaceABI,
        functionName: 'getListing' as const,
        args: [id] as const,
      })),
    [tokenIds],
  )

  const uriContracts = useMemo(
    () =>
      tokenIds.map((id) => ({
        address: nftAddress,
        abi: nftABI,
        functionName: 'tokenURI' as const,
        args: [id] as const,
      })),
    [tokenIds],
  )

  const { data: listings } = useReadContracts({
    contracts: listingContracts,
    query: { enabled: tokenIds.length > 0 },
  })

  const { data: uris } = useReadContracts({
    contracts: uriContracts,
    query: { enabled: tokenIds.length > 0 },
  })

  const listedItems = useMemo(() => {
    if (!listings) return []
    return tokenIds
      .map((id, index) => {
        const result = listings[index]
        if (result?.status !== 'success') return null
        const [price, seller, isListed] = result.result
        if (!isListed) return null
        const uriResult = uris?.[index]
        const tokenUri =
          uriResult?.status === 'success' ? uriResult.result : undefined
        return { tokenId: id, price, seller, tokenUri }
      })
      .filter(Boolean) as {
      tokenId: bigint
      price: bigint
      seller: string
      tokenUri: string | undefined
    }[]
  }, [listings, tokenIds, uris])

  const tokenDecimals = decimals ?? 18
  const tokenSymbol = symbol ?? 'TOKEN'

  if (!listedItems.length) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 p-12 text-center text-zinc-500 dark:border-zinc-700">
        현재 판매 중인 NFT가 없습니다.
      </p>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {listedItems.map((item) => (
        <NftCard
          key={item.tokenId.toString()}
          tokenId={item.tokenId}
          tokenUri={item.tokenUri}
          price={item.price}
          seller={item.seller}
          tokenDecimals={tokenDecimals}
          tokenSymbol={tokenSymbol}
          href={`/nft/${item.tokenId.toString()}?from=market`}
        />
      ))}
    </div>
  )
}
