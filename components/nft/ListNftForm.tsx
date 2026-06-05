'use client'

import { useEffect, useState } from 'react'
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { parseUnits } from 'viem'
import {
  marketplaceABI,
  marketplaceAddress,
  nftABI,
  nftAddress,
} from '@/app/contracts'

type ListNftFormProps = {
  tokenId: bigint
  tokenDecimals: number
  address?: string
  onSuccess?: () => void
}

export function ListNftForm({
  tokenId,
  tokenDecimals,
  address,
  onSuccess,
}: ListNftFormProps) {
  const [priceInput, setPriceInput] = useState('')
  const [step, setStep] = useState<'idle' | 'approve' | 'list'>('idle')
  const [localError, setLocalError] = useState('')
  const [pendingPrice, setPendingPrice] = useState<bigint | null>(null)

  const { data: approved, refetch: refetchApproval, isLoading: isApprovalLoading } =
    useReadContract({
      address: nftAddress,
      abi: nftABI,
      functionName: 'isApprovedForAll',
      args: address
        ? [address as `0x${string}`, marketplaceAddress]
        : undefined,
      query: { enabled: !!address },
    })

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const submitList = (price: bigint) => {
    setStep('list')
    setPendingPrice(price)
    writeContract({
      address: marketplaceAddress,
      abi: marketplaceABI,
      functionName: 'listNFT',
      args: [tokenId, price],
    })
  }

  useEffect(() => {
    if (!isSuccess || !hash) return

    if (step === 'approve' && pendingPrice !== null) {
      refetchApproval().then(() => {
        reset()
        submitList(pendingPrice)
      })
      return
    }

    if (step === 'list') {
      onSuccess?.()
      setStep('idle')
      setPendingPrice(null)
      setPriceInput('')
      reset()
    }
  }, [isSuccess, hash, step, pendingPrice, onSuccess, refetchApproval, reset])

  const handleList = () => {
    if (!address || !priceInput) return
    setLocalError('')

    let price: bigint
    try {
      price = parseUnits(priceInput, tokenDecimals)
      if (price <= BigInt(0)) {
        setLocalError('가격은 0보다 커야 합니다.')
        return
      }
    } catch {
      setLocalError('올바른 가격을 입력하세요.')
      return
    }

    if (approved) {
      submitList(price)
      return
    }

    setStep('approve')
    setPendingPrice(price)
    writeContract({
      address: nftAddress,
      abi: nftABI,
      functionName: 'setApprovalForAll',
      args: [marketplaceAddress, true],
    })
  }

  const isBusy = isPending || isConfirming || isApprovalLoading

  if (!address) {
    return (
      <p className="text-sm text-zinc-500">지갑을 연결하면 판매 등록할 수 있습니다.</p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        inputMode="decimal"
        placeholder="판매 가격 (토큰)"
        value={priceInput}
        onChange={(e) => setPriceInput(e.target.value)}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
      />
      <button
        type="button"
        onClick={handleList}
        disabled={isBusy || !priceInput}
        className="rounded-lg bg-violet-600 px-6 py-3 font-medium text-white hover:bg-violet-500 disabled:opacity-50"
      >
        {isPending || isConfirming
          ? step === 'approve'
            ? '마켓 승인 중…'
            : '판매 등록 중…'
          : isApprovalLoading
          ? '승인 상태 확인 중…'
          : approved
          ? '판매 등록'
          : '판매 등록 (승인 포함)'}
      </button>
      {approved === false && !isBusy && (
        <p className="text-sm text-zinc-500">
          첫 등록 시 마켓플레이스 NFT 승인 후 자동으로 등록됩니다.
        </p>
      )}
      {localError && <p className="text-sm text-red-500">{localError}</p>}
      {error && (
        <p className="text-sm text-red-500">{error.message.slice(0, 160)}</p>
      )}
    </div>
  )
}
