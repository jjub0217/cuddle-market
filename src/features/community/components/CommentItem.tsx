'use client'

import { getTimeAgo } from '@/lib/utils/getTimeAgo'
import { cn } from '@/lib/utils/cn'
import type { Comment } from '@/types'
import ProfileAvatar from '@/components/commons/ProfileAvatar'
import { useState } from 'react'
import { useUserStore } from '@/store/userStore'
import dynamic from 'next/dynamic'
const DeleteReplyModal = dynamic(() => import('@/components/modal/DeleteReplyModal'))

function renderContentWithMention(content: string) {
  const match = content.match(/^(@\S+)([\s\S]*)$/)
  if (!match) return content
  const [, mention, rest] = match
  return (
    <>
      <span className="text-primary-container text-sm md:text-base">{mention}</span>
      {rest}
    </>
  )
}

interface CommentItemProps {
  comment: Comment
  isReply?: boolean
  hasChildren?: boolean
  childrenCount?: number
  onToggleReplies?: () => void
  isRepliesOpen?: boolean
  showBorder?: boolean
  onHandleReply?: () => void
  onDelete?: (commentId: number) => Promise<void>
}

export function CommentItem({
  comment,
  isReply = false,
  hasChildren,
  childrenCount,
  onToggleReplies,
  isRepliesOpen,
  showBorder = true,
  onHandleReply,
  onDelete,
}: CommentItemProps) {
  const user = useUserStore((state) => state.user)
  const isMyComment = user?.id === Number(comment.authorId)
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
          isReply
            ? 'bg-surface-container-low rounded-lg px-2 py-3 md:px-4.5 md:py-4.5'
            : cn(showBorder && 'border-t border-gray-300 pt-3.5', !isRepliesOpen && 'pb-3.5')
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
              <p className="text-[13px] font-semibold md:text-base">{comment.authorNickname}</p>
              {Number(comment.authorId) === user?.id ? (
                <p className="bg-primary-200 rounded-full px-2 py-0.5 text-xs font-semibold text-white">내 댓글</p>
              ) : null}
            </div>
            <p className="whitespace-pre-wrap">{renderContentWithMention(comment.content)}</p>
          </div>
          <div className="flex items-center gap-1">
            <p className="text-xs text-gray-500 md:font-medium">{getTimeAgo(comment.createdAt)}</p>
            <div className="flex items-center gap-1">
              {onHandleReply ? (
                <>
                  <span aria-hidden="true" className="text-xs">
                    ·
                  </span>
                  <button
                    className="text-primary-container cursor-pointer text-xs hover:underline md:font-medium"
                    type="button"
                    onClick={onHandleReply}
                  >
                    답글 달기
                  </button>
                </>
              ) : null}

              {/* 답글 버튼 (대댓글이 아니고, hasChildren이 있을 때만) */}
              {!isReply && hasChildren ? (
                <>
                  <span aria-hidden="true" className="text-xs">
                    ·
                  </span>
                  <button
                    className="text-primary-container cursor-pointer self-start text-xs hover:underline md:font-medium"
                    type="button"
                    onClick={onToggleReplies}
                  >
                    {isRepliesOpen ? '답글 접기' : `답글 ${childrenCount}개`}
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
