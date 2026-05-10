'use client'

import { useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/api'
import type { Comment, CommentPostRequestData } from '@/types'
import { CommentItem } from './CommentItem'
import { CommentForm } from './CommentForm'
import { ReplyOverlay } from './ReplyOverlay'
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
  const [openRepliesCommentId, setOpenRepliesCommentId] = useState<number | null>(null)
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null)
  const [replyingToId, setReplyingToId] = useState<number | null>(null)
  const [replyPostError, setReplyPostError] = useState<React.ReactNode | null>(null)

  const { data: repliesData } = useQuery({
    queryKey: ['community', postId, 'replies', openRepliesCommentId],
    queryFn: async () => {
      const response = await api.get(`/community/comments/${openRepliesCommentId}/replies`)
      return response.data.data as { comments: Comment[] }
    },
    enabled: !!openRepliesCommentId,
  })

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
      setOpenRepliesCommentId(threadId)
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
    setOpenRepliesCommentId(target.threadId)
    setValue('content', target.mention ? `@${target.mention} ` : '')
  }

  const closeReplyForm = () => {
    setReplyingToId(null)
    setActiveThreadId(null)
    reset()
  }

  const handleToggleReplies = (commentId: number) => {
    setOpenRepliesCommentId(openRepliesCommentId === commentId ? null : commentId)
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
    <>
      <ul className="flex flex-col">
        {comments.map((comment, index) => (
          <li key={comment.id} className="flex flex-col">
            <CommentItem
              comment={comment}
              hasChildren={comment.hasChildren}
              childrenCount={comment.childrenCount}
              onToggleReplies={() => handleToggleReplies(comment.id)}
              isRepliesOpen={openRepliesCommentId === comment.id}
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

            {/* 대댓글 목록 */}
            <div
              className={`grid transition-all duration-500 ease-out ${
                openRepliesCommentId === comment.id ? 'mt-3.5 grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                {openRepliesCommentId === comment.id && repliesData?.comments ? (
                  <ul className="flex flex-col gap-2 pb-3.5 pl-10">
                    {repliesData.comments.map((reply, index) => (
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
                ) : null}
              </div>
            </div>
            {/* 데스크톱: 인라인 답글 폼 */}
            {activeThreadId === comment.id ? (
              <div className="hidden pb-3.5 pl-10 md:block">
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

      {/* 모바일: 답글 오버레이 */}
      {(() => {
        if (!activeThreadId) return null
        const targetComment = comments.find((c) => c.id === activeThreadId)
        if (!targetComment) return null
        return (
          <div className="md:hidden">
            <ReplyOverlay
              comment={targetComment}
              replies={openRepliesCommentId === activeThreadId ? repliesData?.comments : undefined}
              value={replyContent}
              onChangeValue={(v) => setValue('content', v)}
              onSubmit={handleSubmit(onSubmit)}
              onClose={closeReplyForm}
              onReplyToReply={(reply) =>
                openReplyForm({
                  commentId: reply.id,
                  threadId: targetComment.id,
                  mention: reply.authorNickname,
                })
              }
            />
          </div>
        )
      })()}
    </>
  )
}
