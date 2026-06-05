import { Suspense } from 'react'
import { MarketplaceApp } from '@/components/MarketplaceApp'

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center text-zinc-500">
          로딩 중…
        </div>
      }
    >
      <MarketplaceApp />
    </Suspense>
  )
}
