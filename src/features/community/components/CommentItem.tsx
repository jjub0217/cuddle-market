'use client'

import { getTimeAgo, splitMention } from '@cuddle/shared'
import { cn } from '@/lib/utils/cn'
import type { Comment } from '@/types'
import ProfileAvatar from '@/components/commons/ProfileAvatar'
import { useState } from 'react'
import { useUserStore } from '@/store/userStore'
import dynamic from 'next/dynamic'
const DeleteReplyModal = dynamic(() => import('@/components/modal/DeleteReplyModal'))

function renderContentWithMention(content: string) {
  const { mention, rest } = splitMention(content)
  if (!mention) return content
  return (
    <>
      <span className="text-primary-container text-sm">{mention}</span>
      {rest}
    </>
  )
}

interface CommentItemProps {
  comment: Comment
  isReply?: boolean
  showBorder?: boolean
  onHandleReply?: () => void
  onDelete?: (commentId: number) => Promise<void>
}

export function CommentItem({ comment, isReply = false, showBorder = true, onHandleReply, onDelete }: CommentItemProps) {
  const user = useUserStore((state) => state.user)
  const isMyComment = user?.id === comment.authorId
  const [isReplyDeleteModalOpen, setIsReplyDeleteModalOpen] = useState(false)

  const handleDelete = () => {
    setIsReplyDeleteModalOpen(true)
  }

  const handleConfirmDelete = async (id: number) => {
    if (onDelete) {
      await onDelete(id)
    }
  }

  return (
    <>
      <div
        className={cn(
          'flex items-start gap-3.5',
          isReply ? 'bg-surface-container-low rounded-lg p-[14px]' : cn(showBorder && 'border-t border-gray-300 pt-3.5', 'pb-3.5')
        )}
      >
        <ProfileAvatar
          imageUrl={comment.authorProfileImageUrl}
          nickname={comment.authorNickname}
          size="sm"
          className="shrink-0"
        />

        {/* 유저 정보 및 내용 */}
        <div className="flex flex-col justify-center gap-2">
          <div className="flex flex-col gap-1 md:gap-2">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold leading-none">{comment.authorNickname}</p>
              {comment.authorId === user?.id ? (
                <p className="bg-primary-200 rounded-full px-2 py-0.5 text-xs font-semibold text-white">내 댓글</p>
              ) : null}
            </div>
            <p className="whitespace-pre-wrap text-[15px] leading-snug">
              {renderContentWithMention(comment.content)}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <p className="text-xs font-medium text-gray-500">{getTimeAgo(comment.createdAt)}</p>
            <div className="flex items-center gap-1">
              {onHandleReply ? (
                <>
                  <span aria-hidden="true" className="text-xs">
                    ·
                  </span>
                  <button
                    className="text-primary-container cursor-pointer text-xs font-medium hover:underline"
                    type="button"
                    onClick={onHandleReply}
                  >
                    답글 달기
                  </button>
                </>
              ) : null}

              {isMyComment ? (
                <>
                  <span aria-hidden="true" className="text-xs">
                    ·
                  </span>
                  <button
                    className="text-primary-container cursor-pointer text-xs font-medium hover:underline"
                    type="button"
                    onClick={handleDelete}
                  >
                    삭제
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <DeleteReplyModal
        isOpen={isReplyDeleteModalOpen}
        replyId={comment.id}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsReplyDeleteModalOpen(false)}
      />
    </>
  )
}
