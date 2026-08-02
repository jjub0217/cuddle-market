'use client'

import Link from 'next/link'

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
  /**
   * 「답글 달기」를 눌렀을 때 갈 곳.
   *
   * 부모 댓글은 **스레드 페이지로 옮겨 간다** — 그 댓글과 그 답글만 보여
   * 대화에 집중할 수 있고, 답글이 길어져도 다른 댓글을 안 밀어낸다.
   * 답글의 「답글 달기」는 이미 그 스레드 안이므로 옮길 데가 없다 —
   * 그때는 onHandleReply로 그 자리에 입력칸을 연다.
   *
   * 스레드 페이지 안에서는 부모도 옮길 데가 없으므로 이 값을 안 넘긴다.
   */
  replyHref?: string
  onHandleReply?: () => void
  onDelete?: (commentId: number) => Promise<void>
}

export function CommentItem({
  comment,
  isReply = false,
  showBorder = true,
  replyHref,
  onHandleReply,
  onDelete,
}: CommentItemProps) {
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
              {replyHref || onHandleReply ? (
                <>
                  <span aria-hidden="true" className="text-xs">
                    ·
                  </span>
                  {replyHref ? (
                    <Link
                      href={replyHref}
                      className="text-primary-container cursor-pointer text-xs font-medium hover:underline"
                    >
                      답글 달기
                    </Link>
                  ) : (
                    <button
                      className="text-primary-container cursor-pointer text-xs font-medium hover:underline"
                      type="button"
                      onClick={onHandleReply}
                    >
                      답글 달기
                    </button>
                  )}
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
