'use client'

import { useId, useState } from 'react'
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { nftABI, nftAddress } from '@/app/contracts'

export function MintTab() {
  const fileInputId = useId()
  const { address, isConnected } = useAccount()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState('')
  const [uploading, setUploading] = useState(false)

  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address || !file || !name.trim()) return

    setUploading(true)
    setStatus('Pinata에 업로드 중…')

    try {
      const body = new FormData()
      body.append('file', file)
      body.append('name', name.trim())
      body.append('description', description.trim())

      const res = await fetch('/api/pinata', { method: 'POST', body })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? '업로드 실패')
      }

      setStatus('민팅 트랜잭션 전송 중…')
      writeContract({
        address: nftAddress,
        abi: nftABI,
        functionName: 'safeMint',
        args: [address as `0x${string}`, data.uri as string],
      })
    } catch (err) {
      setStatus(err instanceof Error ? err.message : '업로드 실패')
    } finally {
      setUploading(false)
    }
  }

  if (!isConnected) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 p-12 text-center text-zinc-500 dark:border-zinc-700">
        지갑을 연결한 뒤 NFT를 민팅할 수 있습니다.
      </p>
    )
  }

  return (
    <form
      onSubmit={handleMint}
      className="mx-auto max-w-lg space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div>
        <label className="mb-1 block text-sm font-medium">NFT 이름</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">설명</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
        />
      </div>
      <div>
        <span className="mb-1 block text-sm font-medium">이미지</span>
        <input
          id={fileInputId}
          type="file"
          accept="image/*"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="sr-only"
        />
        <label
          htmlFor={fileInputId}
          className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
        >
          이미지 파일 선택
        </label>
        {file ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            선택됨: <span className="font-medium text-zinc-800 dark:text-zinc-200">{file.name}</span>
          </p>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">아직 파일이 선택되지 않았습니다</p>
        )}
      </div>
      <button
        type="submit"
        disabled={uploading || isPending || isConfirming}
        className="w-full rounded-lg bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-500 disabled:opacity-50"
      >
        {uploading || isPending || isConfirming ? '처리 중…' : '민팅하기'}
      </button>
      {status && <p className="text-sm text-zinc-600 dark:text-zinc-400">{status}</p>}
      {isSuccess && (
        <p className="text-sm text-green-600">민팅이 완료되었습니다!</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error.message.slice(0, 200)}</p>
      )}
    </form>
  )
}
