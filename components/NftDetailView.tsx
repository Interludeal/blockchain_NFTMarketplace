'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
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
  const { data: offerData, refetch: refetchOffer } = useReadContract({
    address: marketplaceAddress,
    abi: marketplaceABI,
    functionName: 'getOffer',
    args: [tokenId],
  })

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isSuccess: isMined } = useWaitForTransactionReceipt({ hash })

  const [offerInput, setOfferInput] = useState('')

  const offerBuyer = offerData?.[0] as string | undefined
  const offerPrice = offerData?.[1] as bigint | undefined
  const offerIsActive = offerData?.[2] as boolean | undefined

  const isOfferMine = Boolean(
    address && offerBuyer && offerBuyer.toLowerCase() === address.toLowerCase(),
  )

  const doMakeOffer = () => {
    if (!offerInput) return
    writeContract({
      address: marketplaceAddress,
      abi: marketplaceABI,
      functionName: 'makeOffer',
      args: [tokenId, BigInt(offerInput)],
    })
  }

  const doCancelOffer = () => {
    writeContract({
      address: marketplaceAddress,
      abi: marketplaceABI,
      functionName: 'cancelOffer',
      args: [tokenId],
    })
  }

  const doAcceptOffer = () => {
    writeContract({
      address: marketplaceAddress,
      abi: marketplaceABI,
      functionName: 'acceptOffer',
      args: [tokenId],
    })
  }
  const { metadata, imageUrl, loading } = useNftMetadata(tokenUri)

  const tokenDecimals = decimals ?? 18
  const tokenSymbol = symbol ?? 'TOKEN'

  const isListed = listing?.[2] ?? false
  const listPrice = listing?.[0]
  const seller = listing?.[1]

  const isOwner =
    address && owner && owner.toLowerCase() === address.toLowerCase()

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
              {/* 오퍼 섹션 */}
              <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <p className="mb-2 text-sm font-semibold">구매 제안 (Offer)</p>

                {/* 현재 오퍼 정보 표시 */}
                {offerIsActive && offerBuyer && offerPrice !== undefined && (
                  <div className="mb-3 rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-700">
                    <p className="text-zinc-500">
                      제안자:{' '}
                      <span className="font-mono">
                        {shortenAddress(offerBuyer, 6)}
                      </span>
                    </p>
                    <p className="text-zinc-500">
                      제안 가격:{' '}
                      <span className="font-medium text-violet-600">
                        {formatTokenAmount(
                          offerPrice,
                          tokenDecimals,
                          tokenSymbol,
                        )}
                      </span>
                    </p>
                  </div>
                )}

                {/* 소유자: 오퍼 수락 버튼 */}
                {isOwner && offerIsActive && (
                  <button
                    className="mb-2 w-full rounded-lg bg-green-600 px-4 py-2 text-sm text-white disabled:opacity-40"
                    disabled={isPending}
                    onClick={doAcceptOffer}
                  >
                    오퍼 수락 (NFT 판매)
                  </button>
                )}

                {/* 구매자: 내 오퍼 취소 버튼 */}
                {isOfferMine && offerIsActive && (
                  <button
                    className="mb-2 w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm disabled:opacity-40"
                    disabled={isPending}
                    onClick={doCancelOffer}
                  >
                    내 오퍼 취소
                  </button>
                )}

                {/* 구매자: 새 오퍼 제안 */}
                {!isOwner && !offerIsActive && isConnected && (
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-mono dark:border-zinc-700 dark:bg-zinc-800"
                      placeholder="제안 가격 (토큰 최소 단위)"
                      value={offerInput}
                      onChange={(e) => setOfferInput(e.target.value)}
                    />
                    <button
                      className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white disabled:opacity-40"
                      disabled={!offerInput || isPending}
                      onClick={doMakeOffer}
                    >
                      제안하기
                    </button>
                  </div>
                )}

                {isMined && (
                  <p className="mt-2 text-sm text-green-600">✅ 완료</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
