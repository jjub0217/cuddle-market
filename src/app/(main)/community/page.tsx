import type { Metadata } from 'next'
import { Suspense } from 'react'
import CommunityPage from '@/features/community/CommunityPage'
import { toEventStatusParam } from '@/lib/utils/eventStatus'
import { normalizeSortBy } from '@/constants/constants'
import StaticCommunityFallback from '@/features/community/components/StaticCommunityFallback'
import {
  fetchInitialQuestionCommunity,
  fetchInitialInfoCommunity,
  fetchInitialEventCommunity,
} from '@/lib/api/server/community'

export const metadata: Metadata = {
  title: '커뮤니티 | 커들마켓',
  description: '반려동물 질문과 정보를 나누고, 가까운 행사 소식도 확인해 보세요',
  alternates: {
    canonical: '/community',
  },
  openGraph: {
    title: '커뮤니티 | 커들마켓',
    description: '반려동물 질문과 정보를 나누고, 가까운 행사 소식도 확인해 보세요',
    url: 'https://cuddle-market.vercel.app/community',
    siteName: '커들마켓',
    images: [{ url: '/og-image-v2.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '커뮤니티 | 커들마켓',
    description: '반려동물 질문과 정보를 나누고, 가까운 행사 소식도 확인해 보세요',
    images: ['/og-image-v2.png'],
  },
}

interface CommunityRouteProps {
  searchParams: Promise<{
    tab?: string
    searchType?: string
    communityKeyword?: string
    sortBy?: string
    eventStatus?: string
  }>
}

export default async function CommunityRoute({ searchParams }: CommunityRouteProps) {
  const { tab, searchType, communityKeyword, sortBy: rawSortBy, eventStatus } = await searchParams
  const activeTab = tab === 'tab-info' || tab === 'tab-event' ? tab : 'tab-question'
  // 화면(CommunityPage)과 같은 규칙: 그 탭에 없는 정렬 값은 최신으로
  const sortBy = normalizeSortBy(activeTab, rawSortBy)

  const [initialQuestionData, initialInfoData, initialEventData] = await Promise.all([
    activeTab === 'tab-question'
      ? fetchInitialQuestionCommunity(0, 10, searchType, communityKeyword, sortBy)
      : Promise.resolve(null),
    activeTab === 'tab-info'
      ? fetchInitialInfoCommunity(0, 10, searchType, communityKeyword, sortBy)
      : Promise.resolve(null),
    activeTab === 'tab-event'
      ? fetchInitialEventCommunity(0, 10, searchType, communityKeyword, sortBy, toEventStatusParam(eventStatus))
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
