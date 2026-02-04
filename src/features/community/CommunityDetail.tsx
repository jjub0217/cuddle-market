'use client'

import { useRouter, useParams, usePathname, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deletePost, fetchComments, fetchCommunityId, postReply } from '@/lib/api/community'
import MdPreview from './components/markdown/MdPreview'
import { getBoardType } from '@/lib/utils/getBoardType'
import { Badge } from '@/components/commons/badge/Badge'
import { formatDate } from '@/lib/utils/formatDate'
import { CommentList, type ReplyRequestFormValues } from './components/CommentList'
import { CommentForm } from './components/CommentForm'
import { ProfileAvatar } from '@/components/commons/ProfileAvatar'
import { useForm } from 'react-hook-form'
import type { CommentPostRequestData } from '@/types'
import { useEffect, useRef, useState } from 'react'
import PostReportModal from '@/components/modal/PostReportModal'
import DeletePostConfirmModal from '@/components/modal/DeletePostConfirmModal'
import { useUserStore } from '@/store/userStore'
import { useLoginModalStore } from '@/store/modalStore'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { ArrowLeft, EllipsisVertical } from 'lucide-react'
import { IconButton } from '@/components/commons/button/IconButton'
import { cn } from '@/lib/utils/cn'
import { Z_INDEX } from '@/constants/ui'
import { AnimatePresence } from 'framer-motion'
import { SimpleHeader } from '@/components/header/SimpleHeader'
import InlineNotification from '@/components/commons/InlineNotification'
import { useOutsideClick } from '@/hooks/useOutsideClick'

export default function CommunityDetail() {
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

  const user = useUserStore((state) => state.user)
  const setRedirectUrl = useUserStore((state) => state.setRedirectUrl)
  const openLoginModal = useLoginModalStore((state) => state.openLoginModal)
  const pathname = usePathname()
  const searchParamsHook = useSearchParams()
  const isMd = useMediaQuery('(min-width: 768px)')
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isPostDeleteModalOpen, setIsPostDeleteModalOpen] = useState(false)
  const [postDeleteError, setIsPostDeleteError] = useState<React.ReactNode | null>(null)
  const [commentPostError, setCommentPostError] = useState<React.ReactNode | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  useOutsideClick(isMoreMenuOpen, [modalRef], () => setIsMoreMenuOpen(false))

  const router = useRouter()
  const queryClient = useQueryClient()
  const params = useParams()
  const id = params.id as string

  const {
    data,
    isLoading: isLoadingCommunityData,
    error,
  } = useQuery({
    queryKey: ['community', id],
    queryFn: () => fetchCommunityId(id!),
    enabled: !!id,
  })

  const { data: commentData, isLoading: isLoadingCommentData } = useQuery({
    queryKey: ['community', id, 'comments'],
    queryFn: () => fetchComments(id!),
    enabled: !!id,
  })

  const replyMutation = useMutation({
    mutationFn: (requestData: CommentPostRequestData) => postReply(requestData, id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', id, 'comments'] })
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

  const handlePostDelete = async (id: number) => {
    try {
      await deletePost(id)
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
  const handleMoreToggle = () => {
    setIsMoreMenuOpen(!isMoreMenuOpen)
  }

  const handlePostEdit = (postId: number) => {
    router.push(`/community/${postId}/edit`)
  }

  const getHeaderContent = () => {
    switch (data?.boardType) {
      case 'QUESTION':
        return { title: '질문 있어요', description: '궁금한 점을 질문해보세요!', tabId: 'tab-question' }
      case 'INFO':
        return { title: '정보 공유', description: '유용한 정보를 공유해보세요!', tabId: 'tab-info' }
      default:
        return { title: '질문 있어요', description: '궁금한 점을 질문해보세요!', tabId: 'tab-question' }
    }
  }
  const { title: headerTitle, description: headerDescription } = getHeaderContent()

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
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
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
      {!isMd ? (
        <div className={cn('bg-primary-200 sticky top-0 mx-auto flex w-full max-w-7xl justify-between px-3.5 py-4', Z_INDEX.HEADER)}>
          <button type="button" onClick={() => router.back()} className="flex cursor-pointer items-center gap-1 text-gray-600">
            <ArrowLeft size={23} className="text-white" />
          </button>
          <h2 className="heading-h4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-extrabold! text-white">{headerTitle}</h2>
        </div>
      ) : (
        <SimpleHeader
          title={headerTitle}
          description={isMd ? headerDescription : undefined}
          href={`/community?tab=${getHeaderContent().tabId}`}
          layoutClassname="py-5 flex-col justify-between border-b border-gray-200"
        />
      )}
      <div className="min-h-screen bg-[#F3F4F6] pt-5">
        <div className="px-lg pb-4xl mx-auto max-w-7xl">
          <div className="flex flex-col justify-center gap-3.5">
            <div className="flex flex-col gap-3.5 rounded-lg border border-gray-400 bg-white px-6 py-5 shadow-xl">
              <div className="relative flex items-center justify-between">
                <Badge className="bg-primary-400 w-fit rounded-full text-white">{getBoardType(data.boardType ?? '')}</Badge>
                <IconButton className="" size="sm" onClick={handleMoreToggle}>
                  <EllipsisVertical size={16} className="text-gray-500" />
                </IconButton>
                {isMoreMenuOpen && (
                  <div className="absolute top-7 right-0 flex flex-col rounded border border-gray-200 bg-white shadow-md md:min-w-14" ref={modalRef}>
                    {user?.id === data?.authorId ? (
                      <>
                        <button
                          className="cursor-pointer px-3 py-1.5 text-sm whitespace-nowrap hover:bg-gray-50"
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false)
                            handlePostEdit(Number(id))
                          }}
                        >
                          수정
                        </button>
                        <button
                          className="cursor-pointer px-3 py-1.5 text-sm whitespace-nowrap hover:bg-gray-50"
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false)
                            setIsPostDeleteModalOpen(true)
                          }}
                        >
                          삭제
                        </button>
                      </>
                    ) : (
                      <button
                        className="cursor-pointer px-3 py-1.5 text-sm whitespace-nowrap hover:bg-gray-50"
                        type="button"
                        onClick={() => {
                          setIsMoreMenuOpen(false)
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
                )}
              </div>
              <div className="flex items-baseline justify-between md:items-center">
                <div className="flex items-center gap-3.5">
                  <ProfileAvatar imageUrl={data.authorProfileImageUrl} nickname={data.authorNickname} size="lg" />
                  {/* 유저 정보 */}
                  <div className="flex flex-col justify-center gap-0.5">
                    <p>{data.authorNickname}</p>
                    <p>{formatDate(data.createdAt)}</p>
                  </div>
                </div>
                <p>조회 {data.viewCount}</p>
              </div>
              <p className="border-b border-gray-300 pb-3.5 text-lg font-semibold">{data.title}</p>
              <MdPreview value={data.content} className="p-0" />
            </div>

            <div className="flex flex-col gap-3.5 rounded-lg border border-gray-400 bg-white px-6 py-5 shadow-xl">
              <div className="flex items-center gap-1">
                <span>댓글</span>
                <span>{data.commentCount}</span>
              </div>

              {commentData?.comments && <CommentList comments={commentData.comments} postId={id!} />}
              <AnimatePresence>
                {commentPostError && (
                  <InlineNotification type="error" onClose={() => setCommentPostError(null)}>
                    {commentPostError}
                  </InlineNotification>
                )}
              </AnimatePresence>
              <CommentForm
                id="comment-input"
                placeholder="댓글을 입력하세요"
                legendText="댓글 작성폼"
                register={register}
                onSubmit={handleSubmit(onSubmit)}
                onCancel={() => reset()}
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
    </>
  )
}
