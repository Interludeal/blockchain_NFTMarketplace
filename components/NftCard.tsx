'use client'

import Link from 'next/link'
import { useNftMetadata } from '@/hooks/useNftMetadata'
import { formatTokenAmount } from '@/lib/format'

type NftCardProps = {
  tokenId: bigint
  tokenUri?: string
  price?: bigint
  seller?: string
  tokenDecimals?: number
  tokenSymbol?: string
  href?: string
}

export function NftCard({
  tokenId,
  tokenUri,
  price,
  seller,
  tokenDecimals = 18,
  tokenSymbol = 'TOKEN',
  href,
}: NftCardProps) {
  const { metadata, imageUrl, loading } = useNftMetadata(tokenUri)
  const detailHref = href ?? `/nft/${tokenId.toString()}`

  return (
    <Link
      href={detailHref}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:border-violet-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-700"
    >
      <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-800">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            로딩 중…
          </div>
        ) : imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={metadata?.name ?? `NFT #${tokenId}`}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            이미지 없음
          </div>
        )}
        <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
          상세 보기
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold group-hover:text-violet-600 dark:group-hover:text-violet-400">
          {metadata?.name ?? `NFT #${tokenId.toString()}`}
        </h3>
        {metadata?.description && (
          <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
            {metadata.description}
          </p>
        )}
        <p className="text-xs text-zinc-500">Token ID: {tokenId.toString()}</p>
        {price !== undefined && price > BigInt(0) && (
          <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
            {formatTokenAmount(price, tokenDecimals, tokenSymbol)}
          </p>
        )}
        {seller && (
          <p className="font-mono text-xs text-zinc-500">
            판매자: {seller.slice(0, 6)}…{seller.slice(-4)}
          </p>
        )}
      </div>
    </Link>
  )
}
