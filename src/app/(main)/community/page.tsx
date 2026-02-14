import { Suspense } from 'react'
import CommunityPage from '@/features/community/CommunityPage'
import CommunityListSkeleton from '@/features/community/components/CommunityListSkeleton'
import { fetchInitialQuestionCommunity, fetchInitialInfoCommunity } from '@/lib/api/server/community'

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
