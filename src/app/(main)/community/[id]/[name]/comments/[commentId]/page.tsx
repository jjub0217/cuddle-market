import { notFound } from 'next/navigation'

import CommentThread from '@/features/community/CommentThread'
import { fetchCommunityComments, fetchCommunityDetail } from '@/lib/api/server/community'

// 댓글 하나의 스레드 페이지. 상세에서 「답글 달기」를 누르면 여기로 온다.
//
// 주소에 댓글 id가 있어서 새로고침·공유가 된다. 예전 오버레이 방식은
// 주소가 안 바뀌어 그게 안 됐다.

interface ThreadRouteProps {
  params: Promise<{ id: string; name: string; commentId: string }>
}

export default async function CommentThreadRoute({ params }: ThreadRouteProps) {
  const { id, commentId } = await params

  const [post, comments] = await Promise.all([
    fetchCommunityDetail(id),
    fetchCommunityComments(id),
  ])

  if (!post) notFound()

  const comment = comments?.comments.find((item) => item.id === Number(commentId))
  if (!comment) notFound()

  return <CommentThread postId={id} commentId={Number(commentId)} initialComment={comment} />
}
