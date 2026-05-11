'use client'

import { useRouter, useParams, usePathname, useSearchParams } from 'next/navigation'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/api'
import Footer from '@/components/footer/Footer'
import dynamic from 'next/dynamic'

const MdPreview = dynamic(() => import('./components/markdown/MdPreview'), {
  ssr: false,
  loading: () => <div className="p-3 text-sm text-gray-400">로딩 중...</div>,
})
import { getBoardType } from '@/lib/utils/getBoardType'
import Badge from '@/components/commons/badge/Badge'
import { getTimeAgo } from '@/lib/utils/getTimeAgo'
import { CommentList, type ReplyRequestFormValues } from './components/CommentList'
import { CommentForm } from './components/CommentForm'
import ProfileAvatar from '@/components/commons/ProfileAvatar'
import { useForm, useWatch } from 'react-hook-form'
import type { CommentPostRequestData, CommunityDetailItem, Comment } from '@/types'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, MessageSquareText } from 'lucide-react'
const PostReportModal = dynamic(() => import('@/components/modal/PostReportModal'))
const DeletePostConfirmModal = dynamic(() => import('@/components/modal/DeletePostConfirmModal'))
import { useUserStore } from '@/store/userStore'
import { useLoginModalStore } from '@/store/modalStore'
import { AnimatePresence } from 'framer-motion'
import InlineNotification from '@/components/commons/InlineNotification'
import Spinner from '@/components/commons/spinner/Spinner'

interface CommunityDetailProps {
  initialPostData?: CommunityDetailItem
  initialCommentData?: { comments: Comment[] } | null
}

export default function CommunityDetail({ initialPostData, initialCommentData }: CommunityDetailProps) {
  const { handleSubmit, control, setValue, reset } = useForm<ReplyRequestFormValues>({
    mode: 'onChange',
    defaultValues: {
      content: '',
    },
  })

  const commentContent = useWatch({ control, name: 'content' }) ?? ''

  const user = useUserStore((state) => state.user)
  const setRedirectUrl = useUserStore((state) => state.setRedirectUrl)
  const openLoginModal = useLoginModalStore((state) => state.openLoginModal)
  const pathname = usePathname()
  const searchParamsHook = useSearchParams()
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isPostDeleteModalOpen, setIsPostDeleteModalOpen] = useState(false)
  const [postDeleteError, setIsPostDeleteError] = useState<React.ReactNode | null>(null)
  const [commentPostError, setCommentPostError] = useState<React.ReactNode | null>(null)
  const mobileInputRef = useRef<HTMLTextAreaElement>(null)

  const router = useRouter()
  const queryClient = useQueryClient()
  const params = useParams()
  const id = params.id as string

  const {
    data: postQueryData,
    isLoading: isLoadingCommunityData,
    error,
  } = useQuery({
    queryKey: ['community', id],
    queryFn: async () => {
      const response = await api.get(`/community/posts/${id}`)
      return response.data.data as CommunityDetailItem
    },
    enabled: !!id,
  })

  const data = postQueryData ?? initialPostData

  const { data: commentQueryData, isLoading: isLoadingCommentData } = useQuery({
    queryKey: ['community', id, 'comments'],
    queryFn: async () => {
      const response = await api.get(`/community/posts/${id}/comments`, { params: { page: 0, size: 100 } })
      return response.data.data as { comments: Comment[] }
    },
    enabled: !!id,
  })

  const commentData = commentQueryData ?? initialCommentData ?? undefined

  const replyMutation = useMutation({
    mutationFn: (requestData: CommentPostRequestData) =>
      api.post(`/community/posts/${id}/comments`, { content: requestData.content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', id, 'comments'] })
      queryClient.invalidateQueries({ queryKey: ['community', id] })
      reset()
    },
    onError: () => {
      setCommentPostError(
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">댓글 등록에 실패했습니다.</p>
          <p>잠시 후 다시 시도해주세요.</p>
        </div>
      )
    },
  })

  const handlePostDelete = async (postId: number) => {
    try {
      await api.delete(`/community/posts/${postId}`)
      queryClient.invalidateQueries({ queryKey: ['community'] })
      router.push('/community')
    } catch {
      setIsPostDeleteError(
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">게시글 삭제에 실패했습니다.</p>
          <p>잠시 후 다시 시도해주세요.</p>
        </div>
      )
    }
  }
  const handlePostEdit = (postId: number) => {
    router.push(`/community/${postId}/edit`)
  }

  const onSubmit = (data: ReplyRequestFormValues) => {
    if (!data.content.trim()) return
    if (!user) {
      setRedirectUrl(pathname + (searchParamsHook.toString() ? `?${searchParamsHook.toString()}` : ''))
      openLoginModal()
      return
    }
    replyMutation.mutate(data)
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  if (isLoadingCommunityData || isLoadingCommentData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="md" />
      </div>
    )
  }

  if (error || !data || !commentData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p>게시글 정보를 불러올 수 없습니다</p>
          <button onClick={() => router.push('/community')} className="text-blue-600 hover:text-blue-800">
            목록으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-white pt-8 pb-16 md:pb-0">
        <div className="px-lg pb-4xl mx-auto max-w-7xl">
          <div className="flex flex-col justify-center gap-3.5">
            <button
              type="button"
              onClick={() => router.push('/community')}
              className="text-on-surface-muted hover:text-on-surface mb-6 flex w-fit cursor-pointer items-center gap-1.5 text-sm font-semibold transition-colors"
            >
              <ArrowLeft size={16} />
              <span>목록으로 돌아가기</span>
            </button>
            <div className="flex flex-col gap-3.5 rounded-lg">
              <Badge className="bg-primary-400 w-fit rounded-full text-xs text-white md:font-semibold">
                {getBoardType(data.boardType as 'QUESTION' | 'INFO')}
              </Badge>
              <h1 className="text-2xl leading-snug font-bold">{data.title}</h1>
              <div className="border-outline-variant/40 flex items-end justify-between border-b pb-4">
                <div className="flex items-center gap-3.5">
                  <ProfileAvatar
                    imageUrl={data.authorProfileImageUrl}
                    nickname={data.authorNickname}
                    size="lg"
                    className="h-10 w-10 md:h-10 md:w-10"
                  />
                  {/* 유저 정보 */}
                  <div className="flex flex-col gap-2">
                    <p className="text-sm leading-none font-medium md:text-base">{data.authorNickname}</p>
                    <div className="flex items-center gap-1">
                      <p className="text-xs leading-none text-gray-500">{getTimeAgo(data.createdAt)}</p>
                      <span aria-hidden="true" className="text-xs">
                        ·
                      </span>
                      <p className="text-xs leading-none text-gray-500">조회 {data.viewCount}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {user?.id === data?.authorId ? (
                    <>
                      <button
                        className="text-primary-container cursor-pointer text-xs font-medium hover:underline"
                        type="button"
                        onClick={() => handlePostEdit(Number(id))}
                      >
                        수정
                      </button>
                      <span aria-hidden="true" className="text-xs">
                        ·
                      </span>
                      <button
                        className="text-primary-container cursor-pointer text-xs font-medium hover:underline"
                        type="button"
                        onClick={() => setIsPostDeleteModalOpen(true)}
                      >
                        삭제
                      </button>
                    </>
                  ) : (
                    <button
                      className="cursor-pointer text-xs font-medium text-gray-500 hover:underline"
                      type="button"
                      onClick={() => {
                        if (!user) {
                          openLoginModal()
                        } else {
                          setIsReportModalOpen(true)
                        }
                      }}
                    >
                      신고하기
                    </button>
                  )}
                </div>
              </div>
              {/* <h1 className="text-lg leading-snug font-bold">{data.title}</h1> */}
              <MdPreview value={data.content} className="p-0" />
            </div>

            <section aria-label="댓글" className="flex flex-col gap-3.5 py-5">
              <div className="text-md flex items-center gap-1 font-semibold">
                <span>댓글</span>
                <span className="text-primary-container font-semibold">{data.commentCount}</span>
              </div>

              {commentData?.comments && commentData.comments.length > 0 ? (
                <CommentList comments={commentData.comments} postId={id!} />
              ) : (
                <div className="flex flex-col items-center gap-3 py-6 md:hidden">
                  <MessageSquareText size={32} className="text-gray-300" />
                  <p className="text-sm text-gray-400">첫 댓글을 남겨보세요</p>
                  <button
                    type="button"
                    className="bg-primary-500 cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-white"
                    onClick={() => mobileInputRef.current?.focus()}
                  >
                    댓글 쓰기
                  </button>
                </div>
              )}

              <AnimatePresence>
                {commentPostError ? (
                  <InlineNotification type="error" onClose={() => setCommentPostError(null)}>
                    {commentPostError}
                  </InlineNotification>
                ) : null}
              </AnimatePresence>

              {/* 데스크톱용 댓글 입력: 카드 안에 배치 */}
              <div className="hidden md:block">
                <CommentForm
                  id="comment-input-desktop"
                  placeholder="댓글을 입력하세요"
                  legendText="댓글 작성폼"
                  value={commentContent}
                  onChangeValue={(v) => setValue('content', v)}
                  onSubmit={handleSubmit(onSubmit)}
                />
              </div>
            </section>

            {/* 모바일용 댓글 입력: BottomNav(h-14 + iOS safe-area) 바로 위에 고정 */}
            <div
              className="fixed right-0 left-0 border-t border-gray-200 bg-white px-3 py-2 md:hidden"
              style={{
                bottom: 'calc(3.5rem + env(safe-area-inset-bottom))',
                zIndex: 30,
              }}
            >
              <CommentForm
                id="comment-input-mobile"
                placeholder="댓글을 입력하세요"
                legendText="댓글 작성폼"
                value={commentContent}
                onChangeValue={(v) => setValue('content', v)}
                onSubmit={handleSubmit(onSubmit)}
                textareaRef={mobileInputRef}
              />
            </div>
          </div>
        </div>
      </div>
      <PostReportModal
        isOpen={isReportModalOpen}
        postId={Number(id)}
        authorNickname={data.authorNickname}
        postTitle={data.title}
        onCancel={() => setIsReportModalOpen(false)}
      />
      <DeletePostConfirmModal
        isOpen={isPostDeleteModalOpen}
        postId={Number(id)}
        onConfirm={handlePostDelete}
        onCancel={() => setIsPostDeleteModalOpen(false)}
        error={postDeleteError}
        onClearError={() => setIsPostDeleteError(null)}
      />
      <Footer />
    </>
  )
}
