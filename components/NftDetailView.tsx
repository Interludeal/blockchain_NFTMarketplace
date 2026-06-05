'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAccount, useReadContract } from 'wagmi'
import {
  marketplaceABI,
  marketplaceAddress,
  nftABI,
  nftAddress,
  tokenABI,
  tokenAddress,
} from '@/app/contracts'
import { useNftMetadata } from '@/hooks/useNftMetadata'
import { formatTokenAmount, shortenAddress } from '@/lib/format'
import { Header } from '@/components/Header'
import { BuyNftButton } from '@/components/nft/BuyNftButton'
import { ListNftForm } from '@/components/nft/ListNftForm'
import { CancelListingButton } from '@/components/nft/CancelListingButton'

type NftDetailViewProps = {
  tokenId: bigint
  from?: string
}

export function NftDetailView({ tokenId, from }: NftDetailViewProps) {
  const router = useRouter()
  const { address, isConnected } = useAccount()

  const { data: tokenUri } = useReadContract({
    address: nftAddress,
    abi: nftABI,
    functionName: 'tokenURI',
    args: [tokenId],
  })

  const { data: owner } = useReadContract({
    address: nftAddress,
    abi: nftABI,
    functionName: 'ownerOf',
    args: [tokenId],
  })

  const { data: listing, refetch: refetchListing } = useReadContract({
    address: marketplaceAddress,
    abi: marketplaceABI,
    functionName: 'getListing',
    args: [tokenId],
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

  const { metadata, imageUrl, loading } = useNftMetadata(tokenUri)

  const tokenDecimals = decimals ?? 18
  const tokenSymbol = symbol ?? 'TOKEN'

  const isListed = listing?.[2] ?? false
  const listPrice = listing?.[0]
  const seller = listing?.[1]

  const isOwner =
    address &&
    owner &&
    owner.toLowerCase() === address.toLowerCase()

  const isSeller =
    address &&
    seller &&
    isListed &&
    seller.toLowerCase() === address.toLowerCase()

  const backHref =
    from === 'my' ? '/?tab=my' : from === 'mint' ? '/?tab=mint' : '/?tab=market'

  const handleSuccess = () => {
    refetchListing()
    router.refresh()
  }

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <Link
          href={backHref}
          className="mb-6 inline-flex text-sm text-violet-600 hover:text-violet-500 dark:text-violet-400"
        >
          ← 목록으로
        </Link>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
            {loading ? (
              <div className="flex aspect-square items-center justify-center text-zinc-500">
                로딩 중…
              </div>
            ) : imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={metadata?.name ?? `NFT #${tokenId}`}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center text-zinc-500">
                이미지 없음
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                {metadata?.name ?? `NFT #${tokenId.toString()}`}
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Token ID: {tokenId.toString()}
              </p>
            </div>

            {metadata?.description && (
              <p className="text-zinc-600 dark:text-zinc-400">
                {metadata.description}
              </p>
            )}

            <dl className="space-y-2 rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-800">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">소유자</dt>
                <dd className="font-mono">
                  {owner ? shortenAddress(owner, 6) : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">판매 상태</dt>
                <dd>{isListed ? '판매 중' : '미등록'}</dd>
              </div>
              {isListed && listPrice !== undefined && listPrice > BigInt(0) && (
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">가격</dt>
                  <dd className="font-medium text-violet-600 dark:text-violet-400">
                    {formatTokenAmount(listPrice, tokenDecimals, tokenSymbol)}
                  </dd>
                </div>
              )}
              {isListed && seller && (
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">판매자</dt>
                  <dd className="font-mono">{shortenAddress(seller, 6)}</dd>
                </div>
              )}
            </dl>

            <div className="mt-2 border-t border-zinc-200 pt-6 dark:border-zinc-800">
              {isListed && !isSeller && (
                <BuyNftButton
                  tokenId={tokenId}
                  price={listPrice!}
                  seller={seller!}
                  address={address}
                  isConnected={isConnected}
                  onSuccess={handleSuccess}
                />
              )}

              {isSeller && (
                <CancelListingButton
                  tokenId={tokenId}
                  onSuccess={handleSuccess}
                />
              )}

              {isOwner && !isListed && (
                <ListNftForm
                  tokenId={tokenId}
                  tokenDecimals={tokenDecimals}
                  address={address}
                  onSuccess={handleSuccess}
                />
              )}

              {isListed && !isSeller && !isConnected && (
                <p className="text-sm text-zinc-500">
                  지갑을 연결하면 구매할 수 있습니다.
                </p>
              )}

              {!isListed && !isOwner && isConnected && (
                <p className="text-sm text-zinc-500">
                  이 NFT는 현재 판매되지 않습니다.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
