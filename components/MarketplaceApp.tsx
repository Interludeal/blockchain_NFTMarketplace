'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/Header'
import { MarketplaceTab } from '@/components/MarketplaceTab'
import { MyNftsTab } from '@/components/MyNftsTab'
import { MintTab } from '@/components/MintTab'

const tabs = [
  { id: 'market', label: '마켓플레이스' },
  { id: 'my', label: '내 NFT' },
  { id: 'mint', label: '민팅' },
] as const

type TabId = (typeof tabs)[number]['id']

export function MarketplaceApp() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabId>('market')

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'market' || tab === 'my' || tab === 'mint') {
      setActiveTab(tab)
    }
  }, [searchParams])

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <nav className="mb-8 flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        {activeTab === 'market' && <MarketplaceTab />}
        {activeTab === 'my' && <MyNftsTab />}
        {activeTab === 'mint' && <MintTab />}
      </main>
    </div>
  )
}
