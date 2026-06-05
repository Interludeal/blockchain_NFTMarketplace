'use client'

import { useEffect } from 'react'
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import {
  marketplaceABI,
  marketplaceAddress,
  tokenABI,
  tokenAddress,
} from '@/app/contracts'

type BuyNftButtonProps = {
  tokenId: bigint
  price: bigint
  seller: string
  address?: string
  isConnected: boolean
  onSuccess?: () => void
  size?: 'sm' | 'md'
}

export function BuyNftButton({
  tokenId,
  price,
  seller,
  address,
  isConnected,
  onSuccess,
  size = 'md',
}: BuyNftButtonProps) {
  const isOwnListing = Boolean(
    address && seller.toLowerCase() === address.toLowerCase(),
  )

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: tokenABI,
    functionName: 'allowance',
    args: address
      ? [address as `0x${string}`, marketplaceAddress]
      : undefined,
    query: { enabled: !!address },
  })

  const { data: balance } = useReadContract({
    address: tokenAddress,
    abi: tokenABI,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address },
  })

  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  useEffect(() => {
    if (isSuccess) {
      refetchAllowance()
      onSuccess?.()
    }
  }, [isSuccess, onSuccess, refetchAllowance])

  const needsApproval = allowance !== undefined && allowance < price
  const insufficientBalance = balance !== undefined && balance < price

  const handleBuy = () => {
    if (!address) return

    if (needsApproval) {
      writeContract({
        address: tokenAddress,
        abi: tokenABI,
        functionName: 'approve',
        args: [marketplaceAddress, price],
      })
      return
    }

    writeContract({
      address: marketplaceAddress,
      abi: marketplaceABI,
      functionName: 'buyNFT',
      args: [tokenId],
    })
  }

  const btnClass =
    size === 'sm'
      ? 'rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50'
      : 'rounded-lg bg-violet-600 px-6 py-3 text-base font-medium text-white hover:bg-violet-500 disabled:opacity-50'

  if (!isConnected) {
    return (
      <p className="text-sm text-zinc-500">지갑을 연결하면 구매할 수 있습니다.</p>
    )
  }

  if (isOwnListing) {
    return (
      <p className="text-sm text-zinc-500">내가 등록한 NFT입니다.</p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleBuy}
        disabled={isPending || isConfirming || insufficientBalance}
        className={btnClass}
      >
        {isPending || isConfirming
          ? '처리 중…'
          : needsApproval
          ? '토큰 승인 후 구매'
          : '구매하기'}
      </button>
      {insufficientBalance && (
        <p className="text-sm text-red-500">토큰 잔액이 부족합니다.</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error.message.slice(0, 160)}</p>
      )}
      {isSuccess && (
        <p className="text-sm text-green-600">구매가 완료되었습니다.</p>
      )}
    </div>
  )
}
