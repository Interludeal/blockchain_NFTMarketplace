const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/'

export function resolveIpfsUri(uri: string): string {
  if (!uri) return ''
  if (uri.startsWith('ipfs://')) {
    return `${IPFS_GATEWAY}${uri.slice(7)}`
  }
  if (uri.startsWith('https://') || uri.startsWith('http://')) {
    return uri
  }
  return uri
}

export type NftMetadata = {
  name?: string
  description?: string
  image?: string
}

export async function fetchNftMetadata(uri: string): Promise<NftMetadata | null> {
  try {
    const url = resolveIpfsUri(uri)
    const res = await fetch(url)
    if (!res.ok) return null
    return (await res.json()) as NftMetadata
  } catch {
    return null
  }
}
