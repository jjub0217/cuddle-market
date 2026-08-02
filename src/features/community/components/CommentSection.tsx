'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { usePathname, useSearchParams } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { MessageSquareText } from 'lucide-react'

import { api } from '@/lib/api/api'
import InlineNotification from '@/components/commons/InlineNotification'
import { useUserStore } from '@/store/userStore'
import { useLoginModalStore } from '@/store/modalStore'
import type { Comment, CommentPostRequestData } from '@/types'
import { CommentForm } from './CommentForm'
import { CommentList, type ReplyRequestFormValues } from './CommentList'

// 댓글 목록 + 입력창 + 등록 처리를 한 덩어리로 모은 것.
//
// 상세(데스크톱)와 댓글 페이지(모바일)가 같이 쓴다. 예전에는 이게 CommunityDetail
// 안에 흩어져 있었는데, 모바일이 별도 페이지로 나가면서 두 곳이 필요해졌다.
// 베껴 쓰면 한쪽만 고쳐질 자리가 되므로 조각으로 뺀다.

interface CommentSectionProps {
  postId: string
  comments: Comment[]
  /** 입력칸 id. 한 페이지에 둘이 있으면 겹치면 안 된다 */
  inputId: string
  /** 부모 댓글의 「답글 달기」가 갈 스레드 페이지 주소. 스레드 안에서는 안 넘긴다 */
  threadHref?: (commentId: number) => string
  /**
   * 맨 아래 「댓글 쓰기」 칸을 그릴지.
   *
   * 스레드 페이지에서는 끈다. 거기 입력칸은 **글에 새 댓글**을 다는 것이라,
   * 답글을 달러 들어온 사람이 잘못 쓰기 쉽다. 스레드에서는 「답글 달기」로
   * 그 자리에 열리는 칸만 쓴다.
   */
  showComposer?: boolean
}

export function CommentSection({
  postId,
  comments,
  inputId,
  threadHref,
  showComposer = true,
}: CommentSectionProps) {
  const queryClient = useQueryClient()
  const [postError, setPostError] = useState<React.ReactNode | null>(null)

  const user = useUserStore((state) => state.user)
  const setRedirectUrl = useUserStore((state) => state.setRedirectUrl)
  const openLoginModal = useLoginModalStore((state) => state.openLoginModal)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { handleSubmit, control, setValue, reset } = useForm<ReplyRequestFormValues>({
    mode: 'onChange',
    defaultValues: { content: '' },
  })
  const content = useWatch({ control, name: 'content' }) ?? ''

  const mutation = useMutation({
    mutationFn: (data: CommentPostRequestData) =>
      api.post(`/community/posts/${postId}/comments`, { content: data.content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', postId, 'comments'] })
      queryClient.invalidateQueries({ queryKey: ['community', postId] })
      reset()
    },
    onError: () => {
      setPostError(
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">댓글 등록에 실패했습니다.</p>
          <p>잠시 후 다시 시도해주세요.</p>
        </div>
      )
    },
  })

  const onSubmit = (data: ReplyRequestFormValues) => {
    if (!data.content.trim()) return
    if (!user) {
      setRedirectUrl(pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ''))
      openLoginModal()
      return
    }
    mutation.mutate({ content: data.content })
  }

  return (
    <div className="flex flex-col gap-3.5">
      {comments.length > 0 ? (
        <CommentList comments={comments} postId={postId} threadHref={threadHref} />
      ) : (
        <div className="flex flex-col items-center gap-3 py-6">
          <MessageSquareText size={32} className="text-gray-300" />
          <p className="text-sm text-gray-400">첫 댓글을 남겨보세요</p>
        </div>
      )}

      <AnimatePresence>
        {postError ? (
          <InlineNotification type="error" onClose={() => setPostError(null)}>
            {postError}
          </InlineNotification>
        ) : null}
      </AnimatePresence>

      {showComposer ? (
        <CommentForm
          id={inputId}
          placeholder="댓글을 입력하세요"
          legendText="댓글 작성폼"
          value={content}
          onChangeValue={(v) => setValue('content', v)}
          onSubmit={handleSubmit(onSubmit)}
        />
      ) : null}
    </div>
  )
}
