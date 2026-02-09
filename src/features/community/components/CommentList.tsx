'use client'

import { useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteReply, fetchReplies, postReply } from '@/lib/api/community'
import type { Comment, CommentPostRequestData } from '@/types'
import { CommentItem } from './CommentItem'
import { CommentForm } from './CommentForm'
import { useForm } from 'react-hook-form'
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

export function CommentList({ comments, postId }: CommentListProps) {
  const queryClient = useQueryClient()
  const user = useUserStore((state) => state.user)
  const setRedirectUrl = useUserStore((state) => state.setRedirectUrl)
  const openLoginModal = useLoginModalStore((state) => state.openLoginModal)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const {
    handleSubmit, // form onSubmit에 들어가는 함수 : 제출 시 실행할 함수를 감싸주는 함수
    register, // onChange 등의 이벤트 객체 생성 : input에 "이 필드는 폼의 어떤 이름이다"라고 연결해주는 함수
    reset,
  } = useForm<ReplyRequestFormValues>({
    mode: 'onChange',
    defaultValues: {
      content: '',
    },
  })
  const [openRepliesCommentId, setOpenRepliesCommentId] = useState<number | null>(null)
  const [replyingToId, setReplyingToId] = useState<number | null>(null)
  const [replyPostError, setReplyPostError] = useState<React.ReactNode | null>(null)

  const { data: repliesData } = useQuery({
    queryKey: ['community', postId, 'replies', openRepliesCommentId],
    queryFn: () => fetchReplies(String(openRepliesCommentId)),
    enabled: !!openRepliesCommentId,
  })

  const replyMutation = useMutation({
    mutationFn: (requestData: CommentPostRequestData) => postReply(requestData, postId),
    onSuccess: (_data, variables) => {
      const parentId = variables.parentId
      // 대댓글 목록 refetch
      queryClient.invalidateQueries({ queryKey: ['community', postId, 'replies', parentId] })
      // 댓글 목록도 refetch (childrenCount 업데이트를 위해)
      queryClient.invalidateQueries({ queryKey: ['community', postId, 'comments'] })
      // 폼 초기화 및 닫기
      reset()
      setReplyingToId(null)
      // 대댓글 목록 열기
      setOpenRepliesCommentId(parentId ?? null)
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
    mutationFn: (commentId: number) => deleteReply(commentId),
    onSuccess: () => {
      // 댓글 목록 refetch
      queryClient.invalidateQueries({ queryKey: ['community', postId, 'comments'] })
      // 대댓글 목록도 refetch
      queryClient.invalidateQueries({ queryKey: ['community', postId, 'replies'] })
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

  const handleOpenReplyForm = (commentId: number) => {
    if (replyingToId === commentId) {
      setReplyingToId(null)
      reset() // 폼 초기화
    } else {
      setReplyingToId(commentId)
    }
  }

  const handleToggleReplies = (commentId: number) => {
    setOpenRepliesCommentId(openRepliesCommentId === commentId ? null : commentId)
  }

  const onSubmit = (data: ReplyRequestFormValues) => {
    if (!replyingToId) return
    if (!data.content.trim()) return
    if (!user) {
      setRedirectUrl(pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ''))
      openLoginModal()
      return
    }
    const requestData: CommentPostRequestData = {
      content: data.content,
      parentId: replyingToId,
    }
    replyMutation.mutate(requestData)
  }

  return (
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
            onHandleReply={() => handleOpenReplyForm(comment.id)}
            onDelete={handleDeleteComment}
          />

          {/* 대댓글 목록 */}
          <div className={`grid transition-all duration-300 ${openRepliesCommentId === comment.id ? 'mt-3.5 grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="overflow-hidden">
              {openRepliesCommentId === comment.id && repliesData?.comments && (
                <ul className="flex flex-col gap-2 pb-3.5 pl-10">
                  {repliesData.comments.map((reply, index) => (
                    <li key={reply.id}>
                      <CommentItem comment={reply} isReply showBorder={index !== 0} onDelete={handleDeleteComment} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {replyingToId === comment.id && (
            <div className="pb-3.5 pl-10">
              <AnimatePresence>
                {replyPostError && (
                  <InlineNotification type="error" onClose={() => setReplyPostError(null)}>
                    {replyPostError}
                  </InlineNotification>
                )}
              </AnimatePresence>
              <CommentForm
                id={String(comment.id)}
                placeholder="답글을 입력하세요"
                legendText="대댓글 작성폼"
                register={register}
                onSubmit={handleSubmit(onSubmit)}
                onCancel={() => handleOpenReplyForm(comment.id)}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
