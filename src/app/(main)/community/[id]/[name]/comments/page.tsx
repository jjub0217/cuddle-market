import { notFound } from 'next/navigation'
import CommunityComments from '@/features/community/CommunityComments'
import { fetchCommunityComments, fetchCommunityDetail } from '@/lib/api/server/community'

interface CommentsRouteProps {
  params: Promise<{ id: string; name: string }>
}

// 데스크톱 폭에서 이 주소로 바로 들어와도 막지 않는다. 막으면 만들 것만 늘어난다.
export default async function CommentsRoute({ params }: CommentsRouteProps) {
  const { id } = await params

  const [post, comments] = await Promise.all([fetchCommunityDetail(id), fetchCommunityComments(id)])

  if (!post) notFound()

  return <CommunityComments post={post} initialComments={comments?.comments ?? []} />
}
