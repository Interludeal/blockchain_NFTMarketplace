'use client'

import { useEffect, useState } from 'react'
import { fetchNftMetadata, resolveIpfsUri, type NftMetadata } from '@/lib/ipfs'

export function useNftMetadata(tokenUri: string | undefined) {
  const [metadata, setMetadata] = useState<NftMetadata | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!tokenUri) {
      setMetadata(null)
      return
    }

    let cancelled = false
    setLoading(true)

    fetchNftMetadata(tokenUri).then((data) => {
      if (!cancelled) {
        setMetadata(data)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [tokenUri])

  const imageUrl = metadata?.image ? resolveIpfsUri(metadata.image) : ''

  return { metadata, imageUrl, loading }
}
