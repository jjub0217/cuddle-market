'use client'

import { useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import type { Comment } from '@/types'
import { CommentItem } from './CommentItem'
import { CommentForm } from './CommentForm'

interface ReplyOverlayProps {
  comment: Comment
  replies?: Comment[]
  value: string
  onChangeValue: (value: string) => void
  onSubmit: () => void
  onClose: () => void
}

export function ReplyOverlay({ comment, replies, value, onChangeValue, onSubmit, onClose }: ReplyOverlayProps) {
  const totalCount = 1 + (replies?.length ?? 0)

  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    document.body.classList.add('overflow-hidden')

    // 히스토리에 오버레이 상태 추가
    history.pushState({ replyOverlay: true }, '')

    // 뒤로가기 감지
    const handlePopState = () => {
      onCloseRef.current()
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      document.body.classList.remove('overflow-hidden')
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* 헤더 */}
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
        <button type="button" onClick={() => history.back()} className="cursor-pointer">
          <ArrowLeft size={20} />
        </button>
        <span className="text-base font-bold">댓글 {totalCount}</span>
      </div>

      {/* 원본 댓글 + 답글 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <CommentItem comment={comment} showBorder={false} />
        {replies && replies.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-2 pl-10">
            {replies.map((reply, index) => (
              <li key={reply.id}>
                <CommentItem comment={reply} isReply showBorder={index !== 0} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {/* 하단 고정 답글 입력바 */}
      <div className="border-t border-gray-200 bg-white px-3 py-2">
        <CommentForm
          id={`reply-overlay-${comment.id}`}
          placeholder="답글을 입력하세요"
          legendText="답글 작성폼"
          value={value}
          onChangeValue={onChangeValue}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  )
}
