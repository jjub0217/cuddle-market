'use client'

import { formatDate } from '@/lib/utils/formatDate'
import { cn } from '@/lib/utils/cn'
import type { Comment } from '@/types'
import { EllipsisVertical } from 'lucide-react'
import { IconButton } from '@/components/commons/button/IconButton'
import { ProfileAvatar } from '@/components/commons/ProfileAvatar'
import { useRef, useState } from 'react'
import { useUserStore } from '@/store/userStore'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import DeleteReplyModal from '@/components/modal/DeleteReplyModal'

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
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const [isReplyDeleteModalOpen, setIsReplyDeleteModalOpen] = useState(false)

  const handleMoreToggle = () => {
    setIsMoreMenuOpen(!isMoreMenuOpen)
  }

  const modalRef = useRef<HTMLButtonElement>(null)

  useOutsideClick(isMoreMenuOpen, [modalRef], () => setIsMoreMenuOpen(false))

  const handleDelete = () => {
    setIsReplyDeleteModalOpen(true)
    setIsMoreMenuOpen(false)
  }

  const handleConfirmDelete = async (id: number) => {
    if (onDelete) {
      await onDelete(id)
    }
  }

  return (
    <>
      <div className={cn('flex items-start gap-3.5', showBorder && 'border-t border-gray-300 pt-3.5', !isReply && !isRepliesOpen && 'pb-3.5')}>
        <ProfileAvatar imageUrl={comment.authorProfileImageUrl} nickname={comment.authorNickname} size="sm" />

        {/* 유저 정보 및 내용 */}
        <div className="flex flex-col justify-center gap-1">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-1.5">
              <p>{comment.authorNickname}</p>
              {Number(comment.authorId) === user?.id && (
                <p className="bg-primary-200 rounded-full px-2.5 py-1 text-xs font-semibold text-white">작성자</p>
              )}
            </div>
            <p className="text-sm text-gray-400">{formatDate(comment.createdAt)}</p>
          </div>
          <p>{comment.content}</p>

          <div className="flex items-center gap-3.5">
            <button className="cursor-pointer text-sm text-blue-500" type="button" onClick={onHandleReply}>
              답글
            </button>
            {/* 답글 버튼 (대댓글이 아니고, hasChildren이 있을 때만) */}
            {!isReply && hasChildren && (
              <button className="cursor-pointer self-start text-sm text-blue-500 hover:underline" type="button" onClick={onToggleReplies}>
                {isRepliesOpen ? '답글 접기' : `답글 ${childrenCount}개`}
              </button>
            )}
          </div>
        </div>

        {isMyComment && (
          <div className="relative ml-auto">
            <IconButton className="" size="sm" onClick={handleMoreToggle}>
              <EllipsisVertical size={16} className="text-gray-500" />
            </IconButton>
            {isMoreMenuOpen && (
              <button
                className="absolute top-7 right-0 cursor-pointer rounded border border-gray-200 bg-white px-3 py-1.5 text-sm whitespace-nowrap shadow-md hover:bg-gray-50"
                type="button"
                onClick={() => handleDelete()}
                ref={modalRef}
              >
                삭제
              </button>
            )}
          </div>
        )}
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
