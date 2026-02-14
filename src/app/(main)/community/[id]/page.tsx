import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import CommunityDetail from '@/features/community/CommunityDetail'
import CommunityDetailSkeleton from '@/features/community/components/CommunityDetailSkeleton'
import { fetchCommunityDetail, fetchCommunityComments } from '@/lib/api/server/community'

interface CommunityDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CommunityDetailPage({ params }: CommunityDetailPageProps) {
  const { id } = await params
  const [initialPostData, initialCommentData] = await Promise.all([
    fetchCommunityDetail(id),
    fetchCommunityComments(id),
  ])

  if (!initialPostData) {
    notFound()
  }

  return (
    <Suspense fallback={<CommunityDetailSkeleton />}>
      <CommunityDetail initialPostData={initialPostData} initialCommentData={initialCommentData} />
    </Suspense>
  )
}
