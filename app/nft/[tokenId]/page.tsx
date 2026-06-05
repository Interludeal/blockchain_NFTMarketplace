import { notFound } from 'next/navigation'
import { NftDetailView } from '@/components/NftDetailView'

type PageProps = {
  params: Promise<{ tokenId: string }>
  searchParams: Promise<{ from?: string }>
}

export default async function NftDetailPage({ params, searchParams }: PageProps) {
  const { tokenId: tokenIdParam } = await params
  const { from } = await searchParams

  if (!/^\d+$/.test(tokenIdParam)) {
    notFound()
  }

  const tokenId = BigInt(tokenIdParam)

  return <NftDetailView tokenId={tokenId} from={from} />
}
