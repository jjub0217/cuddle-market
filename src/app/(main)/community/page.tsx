import type { Metadata } from 'next'
import { Suspense } from 'react'
import CommunityPage from '@/features/community/CommunityPage'
import CommunityListSkeleton from '@/features/community/components/CommunityListSkeleton'
import { fetchInitialQuestionCommunity, fetchInitialInfoCommunity } from '@/lib/api/server/community'

export const metadata: Metadata = {
  title: '커뮤니티 | 커들마켓',
  description: '반려동물 관련 질문과 유용한 정보를 나눠보세요',
  openGraph: {
    title: '커뮤니티 | 커들마켓',
    description: '반려동물 관련 질문과 유용한 정보를 나눠보세요',
    url: 'https://cuddle-market.vercel.app/community',
    siteName: '커들마켓',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '커뮤니티 | 커들마켓',
    description: '반려동물 관련 질문과 유용한 정보를 나눠보세요',
    images: ['/og-image.png'],
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
  const activeTab = tab === 'tab-info' ? 'tab-info' : 'tab-question'

  const [initialQuestionData, initialInfoData] = await Promise.all([
    activeTab === 'tab-question'
      ? fetchInitialQuestionCommunity(0, 10, searchType, communityKeyword, sortBy)
      : Promise.resolve(null),
    activeTab === 'tab-info'
      ? fetchInitialInfoCommunity(0, 10, searchType, communityKeyword, sortBy)
      : Promise.resolve(null),
  ])

  return (
    <Suspense fallback={<CommunityListSkeleton />}>
      <CommunityPage initialQuestionData={initialQuestionData} initialInfoData={initialInfoData} />
    </Suspense>
  )
}
