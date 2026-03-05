'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import type { MockCommunityPost } from '../../mocks/mockCommunityPosts'

interface CommunityDetailModalProps {
  isOpen: boolean
  post: MockCommunityPost | null
  onClose: () => void
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const MM = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}`
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-500">{label}</p>
      <div className="rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm text-gray-900">
        {value}
      </div>
    </div>
  )
}

function DeleteConfirmDialog({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const confirmRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = confirmRef.current
    if (isOpen && !dialog?.open) {
      dialog?.showModal()
    } else if (!isOpen && dialog?.open) {
      dialog?.close()
    }
  }, [isOpen])

  return (
    <dialog
      ref={confirmRef}
      className="m-auto w-full max-w-fit open:flex flex-col gap-4 rounded-xl bg-white p-6 shadow-2xl backdrop:bg-gray-900/50"
      onClick={(e) => {
        if (e.target === confirmRef.current) onCancel()
      }}
      onClose={(e) => {
        e.stopPropagation()
        onCancel()
      }}
    >
      <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
      <p className="text-sm leading-relaxed text-gray-500">{description}</p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          삭제
        </button>
      </div>
    </dialog>
  )
}

const BOARD_TYPE_COLORS: Record<string, string> = {
  '질문있어요': 'bg-blue-100 text-blue-800',
  '정보공유': 'bg-green-100 text-green-800',
}

export default function CommunityDetailModal({ isOpen, post, onClose }: CommunityDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (isOpen && post && !dialog?.open) {
      dialog?.showModal()
    } else if (!isOpen && dialog?.open) {
      dialog?.close()
    }
  }, [isOpen, post])

  const handleClose = () => {
    setShowDeleteConfirm(false)
    setDeleteCommentId(null)
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-[900px] open:flex flex-col rounded-xl bg-white p-0 shadow-xl backdrop:bg-gray-900/70"
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current.close()
      }}
      onClose={handleClose}
    >
      {post && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">게시글 상세 정보</h3>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="cursor-pointer rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
            <div className="flex gap-6">
              {/* Left Column: images + fields */}
              <div className="flex w-1/2 shrink-0 flex-col">
                {/* Main image */}
                <div className="mb-2 flex h-[260px] w-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Sub images (always 4 cells) */}
                <div className="mb-5 flex gap-2">
                  {Array.from({ length: 4 }, (_, idx) => {
                    const src = post.subImages?.[idx]
                    return (
                      <div
                        key={idx}
                        className="flex h-[60px] w-[60px] items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-50"
                      >
                        {src ? (
                          <img
                            src={src}
                            alt={`서브이미지 ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                          </svg>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Left info fields */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  <Field label="게시글 ID" value={String(post.id)} />
                  <Field label="닉네임" value={post.nickname} />
                </div>
                <div className="mt-4">
                  <Field label="제목" value={post.title} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-4">
                  <Field label="작성일시" value={formatDateTime(post.createdAt)} />
                  <Field label="수정일시" value={formatDateTime(post.updatedAt)} />
                </div>
              </div>

              {/* Right Column: content + badge + comments */}
              <div className="flex w-1/2 flex-col">
                {/* 게시글 내용 */}
                <div className="mb-4">
                  <p className="mb-1.5 text-sm font-medium text-gray-500">게시글 내용</p>
                  <div className="max-h-[160px] overflow-y-auto whitespace-pre-line rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm leading-relaxed text-gray-900">
                    {post.content}
                  </div>
                </div>

                {/* 유형 badge */}
                <div className="mb-4">
                  <p className="mb-1.5 text-sm font-medium text-gray-500">유형</p>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${BOARD_TYPE_COLORS[post.boardType] ?? 'bg-gray-100 text-gray-800'}`}
                  >
                    {post.boardType}
                  </span>
                </div>

                {/* 댓글 목록 */}
                <div className="flex-1">
                  <p className="mb-1.5 text-sm font-medium text-gray-500">
                    댓글 목록 ({post.comments.length})
                  </p>
                  <div className="max-h-[240px] overflow-y-auto rounded-lg border border-gray-200">
                    {post.comments.length === 0 ? (
                      <div className="flex items-center justify-center py-8 text-sm text-gray-400">
                        댓글이 없습니다.
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {post.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className={`flex items-start justify-between gap-2 py-2.5 pr-3 ${comment.depth === 1 ? 'pl-7' : 'pl-3'}`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900">
                                  {comment.nickname}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {formatDateTime(comment.createdAt)}
                                </span>
                              </div>
                              <p className="mt-0.5 text-sm text-gray-700">{comment.content}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDeleteCommentId(comment.id)}
                              className="shrink-0 cursor-pointer rounded-md p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              삭제
            </button>
          </div>

          {/* 게시글 삭제 확인 */}
          <DeleteConfirmDialog
            isOpen={showDeleteConfirm}
            title="게시글 삭제 확인"
            description="삭제 시 해당 게시글과 관련된 모든 데이터가 즉시 삭제되며 되돌릴 수 없습니다."
            onConfirm={() => {
              setShowDeleteConfirm(false)
              dialogRef.current?.close()
            }}
            onCancel={() => setShowDeleteConfirm(false)}
          />

          {/* 댓글 삭제 확인 */}
          <DeleteConfirmDialog
            isOpen={deleteCommentId !== null}
            title="댓글 삭제 확인"
            description="삭제 시 해당 댓글이 즉시 삭제되며 되돌릴 수 없습니다."
            onConfirm={() => {
              setDeleteCommentId(null)
            }}
            onCancel={() => setDeleteCommentId(null)}
          />
        </>
      )}
    </dialog>
  )
}
