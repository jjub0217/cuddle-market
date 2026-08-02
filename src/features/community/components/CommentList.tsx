'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import { replyParentId } from '@cuddle/shared'

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
  /**
   * 부모 댓글의 「답글 달기」가 갈 스레드 페이지 주소를 만든다.
   *
   * 넘기면 부모 댓글은 **페이지를 옮겨** 그 댓글과 답글만 보여준다.
   * 안 넘기면(스레드 페이지 안에서) 부모도 그 자리에 입력칸을 연다.
   *
   * 답글의 「답글 달기」는 언제나 그 자리에서 연다 — 이미 그 스레드 안이다.
   */
  threadHref?: (commentId: number) => string
  /**
   * 이 댓글의 답글 칸을 **늘 열어 둔다** (스레드 화면용).
   *
   * 상세에서는 「답글 달기」를 눌러야 칸이 열리지만, 스레드 화면은 답글을 달러
   * 들어온 자리라 칸이 처음부터 보이는 편이 낫다. 답글마다 따로 칸이 열리지 않고,
   * 이 칸 하나가 대상만 바꾼다 — 「답글 달기」를 누르면 @닉네임이 채워진다.
   */
  alwaysOpenReplyFor?: number
}

interface ReplyTarget {
  commentId: number
  threadId: number
  mention?: string
  /** 그 댓글의 깊이. 서버가 3까지만 받아서 어디에 달지 정할 때 쓴다 */
  depth: number
}

export function CommentList({
  comments,
  postId,
  threadHref,
  alwaysOpenReplyFor,
}: CommentListProps) {
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
  const [activeThreadId, setActiveThreadId] = useState<number | null>(alwaysOpenReplyFor ?? null)
  const [replyingToId, setReplyingToId] = useState<number | null>(alwaysOpenReplyFor ?? null)
  /**
   * 지금 고른 대상의 깊이. 서버가 깊이 3까지만 받아서 이걸 봐야 한다 —
   * 어디에 달지는 shared의 replyParentId가 정한다.
   *
   * 처음 값이 1인 이유: 아무것도 안 골랐으면 대상은 그 스레드의 부모 댓글(depth 1)이다.
   */
  const [replyingToDepth, setReplyingToDepth] = useState(1)
  /** 지금 답글을 다는 대상의 닉네임. 칸 하나가 대상만 바꾸므로 화면에 알려 준다 */
  const [replyMention, setReplyMention] = useState<string | null>(null)

  const replyInputRef = useRef<HTMLTextAreaElement | null>(null)
  /**
   * 「답글 달기」를 **누른 횟수**. 화면을 옮길지 정하는 데만 쓴다.
   *
   * 0이면 처음 그린 것이라 안 움직인다 — 스레드 화면은 칸이 처음부터 열려 있는데,
   * 들어오자마자 화면이 튀면 어리둥절하다.
   */
  const [replyOpenSeq, setReplyOpenSeq] = useState(0)

  // 칸이 화면 밖에 생기면 눌러도 아무 일도 안 일어난 것처럼 보인다.
  // 특히 맨 아래 답글에서 누르면 칸이 접힌 화면 밖이다.
  useEffect(() => {
    if (replyOpenSeq === 0) return
    const input = replyInputRef.current
    if (!input) return
    input.scrollIntoView({ block: 'center', behavior: 'smooth' })
    // 옮기는 것과 초점을 따로 둔다 — focus가 또 움직이면 위 스크롤과 부딪힌다
    input.focus({ preventScroll: true })
    // 커서를 글 끝으로. 그냥 focus만 하면 「@협주 」 앞에서 깜빡여서,
    // 이어 치면 「안녕@협주 」가 된다.
    const end = input.value.length
    input.setSelectionRange(end, end)
  }, [replyOpenSeq])
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
      // 스레드 화면에서는 칸이 늘 열려 있어야 한다. 대상만 그 스레드로 되돌린다.
      setReplyingToId(alwaysOpenReplyFor ?? null)
      setActiveThreadId(alwaysOpenReplyFor ?? null)
      setReplyingToDepth(1)
      setReplyMention(null)
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
      // 같은 대상을 또 누르면 되돌린다. 스레드 화면에서는 칸을 닫지 않고
      // 대상만 그 스레드로 되돌린다 — 칸이 사라지면 답글을 달 길이 없어진다.
      setReplyingToId(alwaysOpenReplyFor ?? null)
      setActiveThreadId(alwaysOpenReplyFor ?? null)
      setReplyingToDepth(1)
      setReplyMention(null)
      setValue('content', '')
      return
    }
    setReplyingToId(target.commentId)
    setActiveThreadId(target.threadId)
    setReplyingToDepth(target.depth)
    setReplyMention(target.mention ?? null)
    setValue('content', target.mention ? `@${target.mention} ` : '')
    setReplyOpenSeq((seq) => seq + 1)
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
      // 깊이 3짜리 답글에 그대로 달면 4가 되어 서버가 거절한다.
      // 그때는 그 스레드의 부모에 단다 — 보이는 자리는 같고 @닉네임이 대상을 알려 준다.
      request: {
        content: data.content,
        parentId: replyParentId(activeThreadId, { commentId: replyingToId, depth: replyingToDepth }),
      },
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
            replyHref={threadHref?.(comment.id)}
            onHandleReply={
              threadHref
                ? undefined
                : () =>
                    openReplyForm({
                      commentId: comment.id,
                      threadId: comment.id,
                      mention: comment.authorNickname,
                      depth: comment.depth,
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
                            depth: reply.depth,
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
              {/* 누구에게 다는 중인지 — 칸 하나가 대상만 바꾸므로 이게 없으면 헷갈린다.
                  그 스레드 자체에 다는 중일 때는 안 그린다(당연한 상태다). */}
              {replyingToId && replyingToId !== comment.id ? (
                <p className="pb-1 text-xs text-gray-500">
                  {replyMention ?? '답글'}님에게 답글 남기는 중
                </p>
              ) : null}
              <CommentForm
                id={String(comment.id)}
                placeholder="답글을 입력하세요"
                legendText="대댓글 작성폼"
                value={replyContent}
                onChangeValue={(v) => setValue('content', v)}
                onSubmit={handleSubmit(onSubmit)}
                variant="compact"
                textareaRef={replyInputRef}
              />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
