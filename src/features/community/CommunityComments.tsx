'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { api } from '@/lib/api/api'
import type { Comment, CommunityDetailItem } from '@/types'
import { CommentSection } from './components/CommentSection'

// 모바일 전용 댓글 페이지.
//
// 왜 페이지를 나누나: 앱이 그렇게 한다. 앱은 하단 입력창과 탭바가 겹쳐서 댓글을
// 별도 화면으로 뺐고, 웹 모바일도 같은 모양으로 맞춘다.
// 데스크톱은 상세 안에 댓글이 그대로 있다 — 넓은 화면에서 페이지를 옮길 이유가 없다.

interface CommunityCommentsProps {
  post: CommunityDetailItem
  initialComments: Comment[]
}

export default function CommunityComments({ post, initialComments }: CommunityCommentsProps) {
  const router = useRouter()
  const postId = String(post.id)

  // 상세와 같은 키를 쓴다 — 상세에서 등록한 것이 여기에도 바로 보인다.
  const { data } = useQuery({
    queryKey: ['community', postId, 'comments'],
    queryFn: async () => {
      // 서버가 댓글을 페이지로 안 나눠 주므로 한 번에 100개를 달라고 한다.
      // 상세(CommunityDetail)가 쓰는 값과 같아야 캐시가 갈라지지 않는다.
      const response = await api.get(`/community/posts/${postId}/comments`, {
        params: { page: 0, size: 100 },
      })
      return response.data.data as { comments: Comment[] }
    },
    initialData: { comments: initialComments },
  })

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-13 items-center gap-2 border-b border-gray-200 px-4">
        <button type="button" onClick={() => router.back()} aria-label="뒤로 가기" className="cursor-pointer">
          <ArrowLeft className="h-6 w-6" />
        </button>
        {/* commentCount는 부모 댓글 + 답글 합계다 */}
        <h1 className="text-base font-semibold">댓글 {post.commentCount}</h1>
      </header>

      <div className="flex-1 px-4 py-3">
        <CommentSection postId={postId} comments={data?.comments ?? []} inputId="comment-input-page" />
      </div>
    </div>
  )
}
