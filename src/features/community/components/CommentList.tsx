'use client'

import { useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/api'
import type { Comment, CommentPostRequestData } from '@/types'
import { CommentItem } from './CommentItem'
import { CommentForm } from './CommentForm'
import { useForm, useWatch } from 'react-hook-form'
import { useUserStore } from '@/store/userStore'
import { useLoginModalStore } from '@/store/modalStore'
import InlineNotification from '@/components/commons/InlineNotification'
import { AnimatePresence } from 'framer-motion'

export interface ReplyRequestFormValues {
  content: string
}

interface CommentListProps {
  comments: Comment[]
  postId: string
}

interface ReplyTarget {
  commentId: number
  threadId: number
  mention?: string
}

export function CommentList({ comments, postId }: CommentListProps) {
  const queryClient = useQueryClient()
  const user = useUserStore((state) => state.user)
  const setRedirectUrl = useUserStore((state) => state.setRedirectUrl)
  const openLoginModal = useLoginModalStore((state) => state.openLoginModal)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { handleSubmit, control, setValue, reset } = useForm<ReplyRequestFormValues>({
    mode: 'onChange',
    defaultValues: {
      content: '',
    },
  })
  const replyContent = useWatch({ control, name: 'content' })
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null)
  const [replyingToId, setReplyingToId] = useState<number | null>(null)
  const [replyPostError, setReplyPostError] = useState<React.ReactNode | null>(null)

  // 답글은 부모 댓글마다 따로 부른다 — 서버가 목록에 답글을 안 담아 준다.
  //
  // 왜 처음부터 다 부르나 (2026-08-01 실측):
  //   글 28개 중 댓글이 달린 글이 5개, 가장 많은 글도 부모 2개 + 답글 5개다.
  //   답글 있는 부모는 글당 1~2개라 요청이 최대 3번이고, 나란히 쏘면 +50ms다.
  //   눌러야 펼쳐지면 글 36에서는 대화의 70%가 처음에 안 보인다.
  //
  // 정말 커지면 앱에서 감출 게 아니라 백엔드에 「목록에 답글도 담아 달라」고 요청한다.
  const parentsWithReplies = comments.filter((comment) => comment.hasChildren)

  const replyQueries = useQueries({
    queries: parentsWithReplies.map((comment) => ({
      queryKey: ['community', postId, 'replies', comment.id],
      queryFn: async () => {
        const response = await api.get(`/community/comments/${comment.id}/replies`)
        return response.data.data as { comments: Comment[] }
      },
    })),
  })

  /** 부모 댓글 id → 답글 목록. 아직 안 온 것은 빈 배열이다 */
  const repliesByParent = new Map<number, Comment[]>(
    parentsWithReplies.map((comment, index) => [comment.id, replyQueries[index]?.data?.comments ?? []])
  )

  /** 답글을 못 불러온 부모 id. 그 자리에만 한 줄 안내를 그린다 */
  const failedParents = new Set<number>(
    parentsWithReplies.filter((_, index) => replyQueries[index]?.isError).map((comment) => comment.id)
  )

  const replyMutation = useMutation({
    mutationFn: (data: { request: CommentPostRequestData; threadId: number }) =>
      api.post(`/community/posts/${postId}/comments`, {
        content: data.request.content,
        parentId: data.request.parentId,
      }),
    onSuccess: (_data, variables) => {
      const { threadId } = variables
      queryClient.invalidateQueries({ queryKey: ['community', postId, 'replies', threadId] })
      queryClient.invalidateQueries({ queryKey: ['community', postId, 'comments'] })
      queryClient.invalidateQueries({ queryKey: ['community', postId] })
      reset()
      setReplyingToId(null)
      setActiveThreadId(null)
    },
    onError: () => {
      setReplyPostError(
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">답글 등록에 실패했습니다.</p>
          <p>잠시 후 다시 시도해주세요.</p>
        </div>
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (commentId: number) => api.delete(`/community/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', postId, 'comments'] })
      queryClient.invalidateQueries({ queryKey: ['community', postId, 'replies'] })
      queryClient.invalidateQueries({ queryKey: ['community', postId] })
    },
  })

  const handleDeleteComment = async (commentId: number) => {
    try {
      await deleteMutation.mutateAsync(commentId)
    } catch {
      setReplyPostError(
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">댓글 삭제에 실패했습니다.</p>
          <p>잠시 후 다시 시도해주세요.</p>
        </div>
      )
    }
  }

  const openReplyForm = (target: ReplyTarget) => {
    if (replyingToId === target.commentId) {
      setReplyingToId(null)
      setActiveThreadId(null)
      reset()
      return
    }
    setReplyingToId(target.commentId)
    setActiveThreadId(target.threadId)
    setValue('content', target.mention ? `@${target.mention} ` : '')
  }

  const onSubmit = (data: ReplyRequestFormValues) => {
    if (!replyingToId || !activeThreadId) return
    if (!data.content.trim()) return
    if (!user) {
      setRedirectUrl(pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ''))
      openLoginModal()
      return
    }
    replyMutation.mutate({
      request: { content: data.content, parentId: replyingToId },
      threadId: activeThreadId,
    })
  }

  return (
    <ul className="flex flex-col">
      {comments.map((comment, index) => (
        <li key={comment.id} className="flex flex-col">
          <CommentItem
            comment={comment}
            showBorder={index !== 0}
            onHandleReply={() =>
              openReplyForm({
                commentId: comment.id,
                threadId: comment.id,
                mention: comment.authorNickname,
              })
            }
            onDelete={handleDeleteComment}
          />

          {/* 답글 — 늘 펼쳐져 있다 */}
          {comment.hasChildren ? (
            <div className="mt-3.5">
              {failedParents.has(comment.id) ? (
                <p className="pb-3.5 pl-10 text-xs text-gray-500">답글을 불러오지 못했어요.</p>
              ) : (
                <ul className="flex flex-col gap-2 pb-3.5 pl-10">
                  {(repliesByParent.get(comment.id) ?? []).map((reply, index) => (
                    <li key={reply.id}>
                      <CommentItem
                        comment={reply}
                        isReply
                        showBorder={index !== 0}
                        onDelete={handleDeleteComment}
                        onHandleReply={() =>
                          openReplyForm({
                            commentId: reply.id,
                            threadId: comment.id,
                            mention: reply.authorNickname,
                          })
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
          {/* 답글 폼 — 폭 상관없이 그 자리에 연다 */}
          {activeThreadId === comment.id ? (
            <div className="pb-3.5 pl-10">
              <AnimatePresence>
                {replyPostError ? (
                  <InlineNotification type="error" onClose={() => setReplyPostError(null)}>
                    {replyPostError}
                  </InlineNotification>
                ) : null}
              </AnimatePresence>
              <CommentForm
                id={String(comment.id)}
                placeholder="답글을 입력하세요"
                legendText="대댓글 작성폼"
                value={replyContent}
                onChangeValue={(v) => setValue('content', v)}
                onSubmit={handleSubmit(onSubmit)}
                variant="compact"
              />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
