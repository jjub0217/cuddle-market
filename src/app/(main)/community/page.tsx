import type { Metadata } from 'next'
import { Suspense } from 'react'
import CommunityPage from '@/features/community/CommunityPage'
import StaticCommunityFallback from '@/features/community/components/StaticCommunityFallback'
import {
  fetchInitialQuestionCommunity,
  fetchInitialInfoCommunity,
  fetchInitialEventCommunity,
} from '@/lib/api/server/community'

export const metadata: Metadata = {
  title: '커뮤니티 | 커들마켓',
  description: '반려동물 관련 질문과 유용한 정보를 나눠보세요',
  alternates: {
    canonical: '/community',
  },
  openGraph: {
    title: '커뮤니티 | 커들마켓',
    description: '반려동물 관련 질문과 유용한 정보를 나눠보세요',
    url: 'https://cuddle-market.vercel.app/community',
    siteName: '커들마켓',
    images: [{ url: '/og-image-v2.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '커뮤니티 | 커들마켓',
    description: '반려동물 관련 질문과 유용한 정보를 나눠보세요',
    images: ['/og-image-v2.png'],
  },
}

interface CommunityRouteProps {
  searchParams: Promise<{
    tab?: string
    searchType?: string
    communityKeyword?: string
    sortBy?: string
  }>
}

export default async function CommunityRoute({ searchParams }: CommunityRouteProps) {
  const { tab, searchType, communityKeyword, sortBy } = await searchParams
  const activeTab = tab === 'tab-info' || tab === 'tab-event' ? tab : 'tab-question'

  const [initialQuestionData, initialInfoData, initialEventData] = await Promise.all([
    activeTab === 'tab-question'
      ? fetchInitialQuestionCommunity(0, 10, searchType, communityKeyword, sortBy)
      : Promise.resolve(null),
    activeTab === 'tab-info'
      ? fetchInitialInfoCommunity(0, 10, searchType, communityKeyword, sortBy)
      : Promise.resolve(null),
    activeTab === 'tab-event'
      ? fetchInitialEventCommunity(0, 10, searchType, communityKeyword, sortBy)
      : Promise.resolve(null),
  ])

  const posts =
    {
      'tab-question': initialQuestionData,
      'tab-info': initialInfoData,
      'tab-event': initialEventData,
    }[activeTab]?.content ?? []

  return (
    <Suspense fallback={<StaticCommunityFallback posts={posts} />}>
      <CommunityPage
        initialQuestionData={initialQuestionData}
        initialInfoData={initialInfoData}
        initialEventData={initialEventData}
      />
    </Suspense>
  )
}
