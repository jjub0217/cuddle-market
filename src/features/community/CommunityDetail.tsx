'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/api'
import Footer from '@/components/footer/Footer'
import dynamic from 'next/dynamic'

const MdPreview = dynamic(() => import('./components/markdown/MdPreview'), {
  ssr: false,
  loading: () => <div className="p-3 text-sm text-gray-400">로딩 중...</div>,
})
import { getBoardType } from '@/lib/utils/getBoardType'
import Badge from '@/components/commons/badge/Badge'
import { getTimeAgo } from '@cuddle/shared'
import { CommentSection } from './components/CommentSection'
import ProfileAvatar from '@/components/commons/ProfileAvatar'
import type { CommunityDetailItem, Comment } from '@/types'
import { useEffect, useState } from 'react'
import { ArrowLeft, ChevronRight } from 'lucide-react'
const PostReportModal = dynamic(() => import('@/components/modal/PostReportModal'))
const DeletePostConfirmModal = dynamic(() => import('@/components/modal/DeletePostConfirmModal'))
import { useUserStore } from '@/store/userStore'
import { useLoginModalStore } from '@/store/modalStore'
import { toUrlName } from '@/lib/utils/toUrlName'
import Spinner from '@/components/commons/spinner/Spinner'

interface CommunityDetailProps {
  initialPostData?: CommunityDetailItem
  initialCommentData?: { comments: Comment[] } | null
}

export default function CommunityDetail({ initialPostData, initialCommentData }: CommunityDetailProps) {
  const user = useUserStore((state) => state.user)
  const openLoginModal = useLoginModalStore((state) => state.openLoginModal)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isPostDeleteModalOpen, setIsPostDeleteModalOpen] = useState(false)
  const [postDeleteError, setIsPostDeleteError] = useState<React.ReactNode | null>(null)

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
      <div className="min-h-screen bg-white pt-5 pb-16 md:pt-8 md:pb-0">
        <div className="px-lg md:pb-4xl mx-auto max-w-7xl pb-0">
          <div className="flex flex-col justify-center gap-1 md:gap-3.5">
            <button
              type="button"
              onClick={() => router.push('/community')}
              className="text-on-surface-muted hover:text-on-surface mb-6 hidden w-fit cursor-pointer items-center gap-1.5 text-sm font-semibold transition-colors md:flex"
            >
              <ArrowLeft size={16} />
              <span>목록으로 돌아가기</span>
            </button>
            <div className="flex flex-col gap-3.5 rounded-lg">
              <Badge className="bg-primary-400 w-fit rounded-full text-xs text-white md:font-semibold">
                {getBoardType(data.boardType as 'QUESTION' | 'INFO')}
              </Badge>
              <div className="flex flex-col-reverse gap-3.5 md:flex-col">
                <h1 className="border-outline-variant/40 border-b pb-4 text-xl leading-snug font-bold md:border-0 md:p-0 md:text-2xl">
                  {data.title}
                </h1>
                <div className="md:border-outline-variant/40 flex items-end justify-between md:border-b md:pb-4">
                  <div className="flex items-center gap-3.5">
                    <ProfileAvatar
                      imageUrl={data.authorProfileImageUrl}
                      nickname={data.authorNickname}
                      size="lg"
                      className="h-10 w-10 md:h-10 md:w-10"
                    />
                    {/* 유저 정보 */}
                    <div className="flex flex-col gap-2">
                      <p className="text-sm leading-none font-bold text-[#1c1b1b] md:text-base md:font-medium">
                        {data.authorNickname}
                      </p>
                      <div className="flex items-center gap-0.5 md:gap-1">
                        <p className="text-xs leading-none text-[#827565]">{getTimeAgo(data.createdAt)}</p>
                        <span aria-hidden="true" className="text-xs">
                          ·
                        </span>
                        <p className="text-xs leading-none text-[#827565]">조회 {data.viewCount}</p>
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
              </div>
              {/* <h1 className="text-lg leading-snug font-bold">{data.title}</h1> */}
              <MdPreview value={data.content} className="p-0" />
            </div>

            {/* 데스크톱: 상세 안에 댓글이 그대로 */}
            {/* hidden … md:flex를 쓴다(md:block이 아니라). 원래 flex flex-col이라 block으로 바꾸면 gap-3.5가 죽는다 */}
            <section
              aria-label="댓글"
              className="border-outline-variant/40 hidden flex-col gap-3.5 border-t py-5 md:flex md:border-t-0"
            >
              <div className="md:text-md flex items-center gap-1 text-sm font-semibold">
                <span>댓글</span>
                <span className="text-primary-container font-semibold">{data.commentCount}</span>
              </div>

              <CommentSection postId={id!} comments={commentData?.comments ?? []} inputId="comment-input-desktop" />
            </section>

            {/* 모바일: 줄 하나만. 누르면 댓글 페이지로 */}
            <Link
              href={`/community/${data.id}/${toUrlName(data.title)}/comments`}
              className="flex items-center justify-between border-t border-gray-200 py-4 md:hidden"
            >
              <span className="text-base font-semibold">
                댓글 <span className="text-primary-container">{data.commentCount}</span>
              </span>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Link>
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
