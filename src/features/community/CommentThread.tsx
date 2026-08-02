'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { api } from '@/lib/api/api'
import type { Comment } from '@/types'
import { CommentSection } from './components/CommentSection'

// 댓글 하나와 그 답글만 보는 화면.
//
// 왜 페이지를 나누나:
// 답글을 달 때는 그 대화에 집중하는 것이 낫다. 상세에 그대로 두면 답글이 길어질수록
// 다른 댓글이 밀려나고, 어디에 답을 다는 중인지 흐려진다. 당근도 같은 방식이다.
//
// 상세에서는 댓글을 **전부 펼쳐** 보여주고, 「답글 달기」를 눌렀을 때만 여기로 온다.
//
// 여기서는 threadHref를 안 넘긴다 — 이미 그 스레드 안이라 옮길 데가 없다.
// 그래서 부모 댓글의 「답글 달기」도 이 화면 안에서 입력칸을 연다.

interface CommentThreadProps {
  postId: string
  commentId: number
  /** 서버에서 미리 받아 둔 부모 댓글. 없으면 이 화면에서 받는다 */
  initialComment?: Comment
}

export default function CommentThread({ postId, commentId, initialComment }: CommentThreadProps) {
  const router = useRouter()

  // 상세와 같은 키를 쓴다 — 상세에서 등록한 것이 여기에도 바로 보인다.
  const { data } = useQuery({
    queryKey: ['community', postId, 'comments'],
    queryFn: async () => {
      const response = await api.get(`/community/posts/${postId}/comments`, {
        params: { page: 0, size: 100 },
      })
      return response.data.data as { comments: Comment[] }
    },
    initialData: initialComment ? { comments: [initialComment] } : undefined,
  })

  const comment = data?.comments.find((item) => item.id === commentId) ?? initialComment

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-13 items-center gap-2 border-b border-gray-200 px-4">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로 가기"
          className="cursor-pointer"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-base font-semibold">
          {/* 원 댓글 1 + 답글 수. 서버 commentCount는 글 전체 수라 여기 쓸 수 없다 */}
          답글 {comment?.childrenCount ?? 0}
        </h1>
      </header>

      <div className="flex-1 px-4 py-3">
        {comment ? (
          <CommentSection
            postId={postId}
            comments={[comment]}
            inputId="comment-input-thread"
            // 맨 아래 「댓글 쓰기」 칸은 글에 **새 댓글**을 다는 것이라 여기서는 끈다.
            // 대신 답글 칸이 처음부터 열려 있다 — 답글을 달러 들어온 자리다.
            showComposer={false}
            alwaysOpenReplyFor={commentId}
          />
        ) : (
          <p className="py-10 text-center text-sm text-gray-400">댓글을 찾을 수 없어요.</p>
        )}
      </div>
    </div>
  )
}
