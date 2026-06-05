'use client'

import { useEffect } from 'react'
import {
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { marketplaceABI, marketplaceAddress } from '@/app/contracts'

type CancelListingButtonProps = {
  tokenId: bigint
  onSuccess?: () => void
}

export function CancelListingButton({
  tokenId,
  onSuccess,
}: CancelListingButtonProps) {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  useEffect(() => {
    if (isSuccess) onSuccess?.()
  }, [isSuccess, onSuccess])

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() =>
          writeContract({
            address: marketplaceAddress,
            abi: marketplaceABI,
            functionName: 'cancelListing',
            args: [tokenId],
          })
        }
        disabled={isPending || isConfirming}
        className="rounded-lg border border-zinc-300 px-6 py-3 font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800 disabled:opacity-50"
      >
        {isPending || isConfirming ? '처리 중…' : '판매 취소'}
      </button>
      {error && (
        <p className="text-sm text-red-500">{error.message.slice(0, 160)}</p>
      )}
      {isSuccess && (
        <p className="text-sm text-green-600">판매가 취소되었습니다.</p>
      )}
    </div>
  )
}
