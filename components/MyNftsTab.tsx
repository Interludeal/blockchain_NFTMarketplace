'use client'

import { useMemo } from 'react'
import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import {
  marketplaceABI,
  marketplaceAddress,
  nftABI,
  nftAddress,
  tokenABI,
  tokenAddress,
} from '@/app/contracts'
import { NftCard } from '@/components/NftCard'

export function MyNftsTab() {
  const { address, isConnected } = useAccount()

  const { data: balance } = useReadContract({
    address: nftAddress,
    abi: nftABI,
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

  const { data: totalSupply } = useReadContract({
    address: nftAddress,
    abi: nftABI,
    functionName: 'totalSupply',
  })

  const ownedIndices = useMemo(() => {
    const count = balance ? Number(balance) : 0
    return Array.from({ length: count }, (_, i) => BigInt(i))
  }, [balance])

  const ownedContracts = useMemo(
    () =>
      address
        ? ownedIndices.map((index) => ({
            address: nftAddress,
            abi: nftABI,
            functionName: 'tokenOfOwnerByIndex' as const,
            args: [address as `0x${string}`, index] as const,
          }))
        : [],
    [address, ownedIndices],
  )

  const { data: ownedTokenResults } = useReadContracts({
    contracts: ownedContracts,
    query: { enabled: !!address && ownedIndices.length > 0 },
  })

  const ownedTokenIds = useMemo(() => {
    if (!ownedTokenResults) return []
    return ownedTokenResults
      .filter((r) => r.status === 'success')
      .map((r) => r.result as bigint)
  }, [ownedTokenResults])

  const allTokenIds = useMemo(() => {
    const count = totalSupply ? Number(totalSupply) : 0
    return Array.from({ length: count }, (_, i) => BigInt(i))
  }, [totalSupply])

  const listingContracts = useMemo(
    () =>
      allTokenIds.map((id) => ({
        address: marketplaceAddress,
        abi: marketplaceABI,
        functionName: 'getListing' as const,
        args: [id] as const,
      })),
    [allTokenIds],
  )

  const { data: allListings } = useReadContracts({
    contracts: listingContracts,
    query: { enabled: allTokenIds.length > 0 },
  })

  const listedByMe = useMemo(() => {
    if (!allListings || !address) return []
    return allTokenIds
      .map((id, index) => {
        const result = allListings[index]
        if (result?.status !== 'success') return null
        const [price, seller, isListed] = result.result
        if (
          !isListed ||
          seller.toLowerCase() !== address.toLowerCase()
        ) {
          return null
        }
        if (ownedTokenIds.some((owned) => owned === id)) return null
        return { tokenId: id, price, seller, isListed: true as const }
      })
      .filter(Boolean) as {
      tokenId: bigint
      price: bigint
      seller: string
      isListed: true
    }[]
  }, [allListings, allTokenIds, address, ownedTokenIds])

  const myTokenIds = useMemo(() => {
    const unique = new Map<string, { tokenId: bigint; isListed: boolean; price?: bigint }>()
    for (const id of ownedTokenIds) {
      unique.set(id.toString(), { tokenId: id, isListed: false })
    }
    for (const item of listedByMe) {
      unique.set(item.tokenId.toString(), {
        tokenId: item.tokenId,
        isListed: true,
        price: item.price,
      })
    }
    return [...unique.values()]
  }, [ownedTokenIds, listedByMe])

  const uriContracts = useMemo(
    () =>
      myTokenIds.map(({ tokenId }) => ({
        address: nftAddress,
        abi: nftABI,
        functionName: 'tokenURI' as const,
        args: [tokenId] as const,
      })),
    [myTokenIds],
  )

  const listingDetailContracts = useMemo(
    () =>
      myTokenIds.map(({ tokenId }) => ({
        address: marketplaceAddress,
        abi: marketplaceABI,
        functionName: 'getListing' as const,
        args: [tokenId] as const,
      })),
    [myTokenIds],
  )

  const { data: uris } = useReadContracts({
    contracts: uriContracts,
    query: { enabled: myTokenIds.length > 0 },
  })

  const { data: listingDetails } = useReadContracts({
    contracts: listingDetailContracts,
    query: { enabled: myTokenIds.length > 0 },
  })

  const tokenDecimals = decimals ?? 18
  const tokenSymbol = symbol ?? 'TOKEN'

  if (!isConnected) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 p-12 text-center text-zinc-500 dark:border-zinc-700">
        지갑을 연결하면 내 NFT를 볼 수 있습니다.
      </p>
    )
  }

  if (!myTokenIds.length) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 p-12 text-center text-zinc-500 dark:border-zinc-700">
        보유한 NFT가 없습니다. 민팅 탭에서 새 NFT를 만들어 보세요.
      </p>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {myTokenIds.map(({ tokenId }, index) => {
        const uriResult = uris?.[index]
        const tokenUri =
          uriResult?.status === 'success' ? uriResult.result : undefined
        const listingResult = listingDetails?.[index]
        const isListed =
          listingResult?.status === 'success'
            ? listingResult.result[2]
            : false
        const price =
          listingResult?.status === 'success'
            ? listingResult.result[0]
            : undefined

        return (
          <NftCard
            key={tokenId.toString()}
            tokenId={tokenId}
            tokenUri={tokenUri}
            price={isListed ? price : undefined}
            tokenDecimals={tokenDecimals}
            tokenSymbol={tokenSymbol}
            href={`/nft/${tokenId.toString()}?from=my`}
          />
        )
      })}
    </div>
  )
}
